import { NextRequest } from 'next/server';
import { authenticate, extractApiKey } from '@/lib/auth';
import { createUnauthorizedResponse } from '@/lib/response-helpers';
import { getConfig, resolveProvider } from '@/config';
import { ProtocolFactory } from '@/protocols';
import type { ProtocolBody } from '@/types/protocol';

import { CORS_HEADERS } from '@/utils/constants';
import { createLogger } from '@/utils/logger';
import { getTypedContext } from '@/lib/cloudflare-context';

interface AnalyticsEngineDataset {
  writeDataPoint(event?: { blobs?: (string | ArrayBuffer | null)[]; doubles?: number[]; indexes?: (string | ArrayBuffer | null)[] }): void;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export const dynamic = 'force-dynamic';

interface ChatBody {
  model: string;
  stream?: boolean;
  store?: unknown;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  const logger = createLogger();

  const { env, ctx } = getTypedContext();

  const authResult = await authenticate(request, env);
  if (!authResult) {
    return createUnauthorizedResponse();
  }

  // Check debug mode from URL query parameter or header
  const url = new URL(request.url);
  const debugParam = url.searchParams.get('debug');
  const debugHeader = request.headers.get('x-debug');
  const isDebug = debugParam === 'true' || debugParam === '1' || debugHeader === 'true' || debugHeader === '1';

  try {
    const rawBody = (await request.json()) as ChatBody;
    const rawBodyObj = rawBody as unknown as Record<string, unknown>;
    delete rawBodyObj.store;

    const requestedModel = rawBody.model;
    const isStream = !isDebug && rawBody.stream === true;

    const config = getConfig(env);
    const { name: providerName, provider, realModel } = resolveProvider(config, requestedModel, 'openai');
    if (!provider) {
      throw new Error(`No provider found for model: ${requestedModel}`);
    }

    if (provider.family !== 'openai') {
      throw new Error(
        `Chat completions endpoint only supports 'openai' family providers. Got: ${provider.family} (provider: ${providerName})`
      );
    }

    logger.info('Request routed', { model: requestedModel, realModel, isStream, providerName, providerType: provider.type });

    // Record analytics data point (async, non-blocking)
    const apiKey = extractApiKey(request) || 'anonymous';
    (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
      blobs: [
        'llm_api', // blob1: fixed tag for filtering
        '/v1/chat/completions', // blob2: request path
        requestedModel, // blob3: model name
        isStream ? 'stream' : 'non-stream', // blob4: stream type
        providerName, // blob5: provider name
      ],
      indexes: [apiKey], // index for sampling (masked for security)
    });

    const clientProtocol = ProtocolFactory.get('openai');
    const upstreamProtocol = ProtocolFactory.get(provider.type);

    const standardRequest = clientProtocol.toStandardRequest(rawBody);
    const upstreamRequest = upstreamProtocol.fromStandardRequest(standardRequest);

    // Replace model name with resolved model (handles aliases)
    upstreamRequest.model = realModel;

    // Ensure upstream returns usage in streaming responses
    // (OpenAI spec requires stream_options.include_usage for usage in SSE chunks)
    if (isStream) {
      upstreamRequest.stream_options = { include_usage: true };
    }

    const MAX_ATTEMPTS = upstreamProtocol.getAttempt();
    let lastResponse: Response | undefined;

    let fetchUrl = '';
    let fetchHeaders: Record<string, string> = {};
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const upstreamApiKey = await upstreamProtocol.getApiKey(env, provider, ctx);
      fetchUrl = await upstreamProtocol.getEndpoint(provider, realModel, isStream, upstreamApiKey);
      fetchHeaders = await upstreamProtocol.getHeaders(provider, env, ctx, upstreamApiKey);
      lastResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(upstreamRequest),
      });
      if (lastResponse.status !== 429 || attempt === MAX_ATTEMPTS) break;
      logger.warn(`Upstream 429 Rate Limit, retrying...`, { attempt });
    }

    if (lastResponse && !lastResponse.ok) {
      logger.error('Upstream request failed', { status: lastResponse.status, statusText: lastResponse.statusText });
    }

    const resHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': isStream ? 'text/event-stream' : 'application/json',
    };

    if (isStream && lastResponse) {
      let stream = lastResponse.body;
      if (!stream) {
        throw new Error('Response body is null');
      }

      // Parse usage inline instead of tee()+background reader (race condition:
      // flush() fired before background reader finished, losing analytics).
      let tokenUsage: TokenUsage | null = null;
      const decoder = new TextDecoder();
      const tokenCaptureStream = new TransformStream({
        transform(chunk, controller) {
          // OpenAI streaming: last chunk before [DONE] contains json.usage
          try {
            const text = decoder.decode(chunk, { stream: true });
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const json = JSON.parse(line.slice(6));
                  if (json.usage) {
                    tokenUsage = {
                      prompt_tokens: json.usage.prompt_tokens || 0,
                      completion_tokens: json.usage.completion_tokens || 0,
                      total_tokens: json.usage.total_tokens || 0,
                    };
                  }
                } catch (_e) {
                  // Ignore parse errors for individual lines
                }
              }
            }
          } catch (_e) {
            // Ignore decode errors
          }
          controller.enqueue(chunk);
        },
        flush() {
          // transform() processes all chunks before flush(), so tokenUsage is set
          if (tokenUsage) {
            (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
              blobs: [
                'llm_api_tokens', // blob1: event type for token tracking
                requestedModel, // blob2: model name
                providerName, // blob3: provider name
                'stream', // blob4: stream type
              ],
              doubles: [
                tokenUsage.prompt_tokens, // double1: prompt tokens
                tokenUsage.completion_tokens, // double2: completion tokens
                tokenUsage.total_tokens, // double3: total tokens
              ],
              indexes: [apiKey],
            });
          }
        },
      });

      stream = stream.pipeThrough(upstreamProtocol.createToStandardStream(realModel));
      stream = stream.pipeThrough(clientProtocol.createFromStandardStream());
      stream = stream.pipeThrough(tokenCaptureStream);

      return new Response(stream, {
        headers: { ...resHeaders, 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    } else if (lastResponse) {
      const upstreamJson = await lastResponse.json();

      if (isDebug) {
        const responseHeaders: Record<string, string> = {};
        lastResponse.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        const debugResponse = {
          debug: true,
          upstream: {
            status: lastResponse.status,
            statusText: lastResponse.statusText,
            headers: responseHeaders,
            url: fetchUrl,
            request: upstreamRequest,
            body: upstreamJson,
          },
          provider: {
            name: providerName,
            type: provider.type,
          },
          model: requestedModel,
        };
        return new Response(JSON.stringify(debugResponse, null, 2), {
          headers: { ...resHeaders, 'Content-Type': 'application/json' },
        });
      }

      const standardResponse = upstreamProtocol.toStandardResponse(upstreamJson as ProtocolBody, realModel);

      // Extract token usage from response
      const usage = (standardResponse as Record<string, unknown>).usage as Record<string, number> | undefined;
      if (usage) {
        (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
          blobs: [
            'llm_api_tokens', // blob1: event type for token tracking
            requestedModel, // blob2: model name
            providerName, // blob3: provider name
            'non-stream', // blob4: stream type
          ],
          doubles: [
            usage.prompt_tokens || 0, // double1: prompt tokens
            usage.completion_tokens || 0, // double2: completion tokens
            usage.total_tokens || 0, // double3: total tokens
          ],
          indexes: [apiKey],
        });
      }

      const clientResponse = clientProtocol.fromStandardResponse(standardResponse);

      return new Response(JSON.stringify(clientResponse), { headers: resHeaders });
    }

    throw new Error('No response from upstream');
  } catch (err) {
    logger.error('Internal Server Error', { message: (err as Error).message, stack: (err as Error).stack });
    return new Response(JSON.stringify({ error: { message: (err as Error).message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
}
