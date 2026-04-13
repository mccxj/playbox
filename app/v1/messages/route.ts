import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { authenticate, createUnauthorizedResponse } from '@/lib/auth';
import { createInternalErrorResponse } from '@/lib/response-helpers';
import { getConfig, resolveProvider } from '@/config';
import { ProtocolFactory } from '@/protocols';
import type { Env } from '@/types';
import { createLogger } from '@/utils/logger';
import { CORS_HEADERS } from '@/utils/constants';

interface AnalyticsEngineDataset {
  writeDataPoint(event?: { blobs?: (string | ArrayBuffer | null)[]; doubles?: number[]; indexes?: (string | ArrayBuffer | null)[] }): void;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface MessagesBody {
  model: string;
  stream?: boolean;
  messages?: any[];
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  const logger = createLogger();

  const { env: rawEnv, ctx } = getRequestContext();
  const env = rawEnv as unknown as Env;

  const authResult = authenticate(request as any, env);
  if (!authResult) {
    return createUnauthorizedResponse();
  }

  try {
    const rawBody = (await request.json()) as MessagesBody;
    delete (rawBody as any).store;

    const requestedModel = rawBody.model;
    const isStream = rawBody.stream === true;

	const config = getConfig(env);
    const { name: providerName, provider } = resolveProvider(config, requestedModel, 'anthropic');
	if (!provider) {
		throw new Error(`No provider found for model: ${requestedModel}`);
	}

	if (provider.family !== 'anthropic') {
		throw new Error(`Messages endpoint only supports 'anthropic' family providers. Got: ${provider.family} (provider: ${providerName})`);
	}

  logger.info('Request routed', { model: requestedModel, isStream, providerName, providerType: provider.type });

  // Record analytics data point (async, non-blocking)
  const apiKey = request.headers.get('x-api-key') || request.headers.get('Authorization')?.replace('Bearer ', '') || 'anonymous';
  (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
    blobs: [
      'llm_api', // blob1: fixed tag for filtering
      '/v1/messages', // blob2: request path
      requestedModel, // blob3: model name
      isStream ? 'stream' : 'non-stream', // blob4: stream type
      providerName, // blob5: provider name
    ],
    indexes: [apiKey], // index for sampling
  });

  const clientProtocol = ProtocolFactory.get('anthropic');
	const upstreamProtocol = ProtocolFactory.get(provider.type);

    const standardRequest = clientProtocol.toStandardRequest(rawBody);
    const upstreamRequest = upstreamProtocol.fromStandardRequest(standardRequest);

    const MAX_ATTEMPTS = upstreamProtocol.getAttempt();
    let lastResponse: Response | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
	const apiKey = await upstreamProtocol.getApiKey(env, provider, ctx);
	let fetchUrl = await upstreamProtocol.getEndpoint(provider, requestedModel, isStream, apiKey);
	const fetchHeaders = await upstreamProtocol.getHeaders(provider, env, ctx, apiKey);
      lastResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(upstreamRequest)
      });
      if (lastResponse.status !== 429 || attempt === MAX_ATTEMPTS) break;
      logger.warn(`Upstream 429 Rate Limit, retrying...`, { attempt });
    }

    if (lastResponse && !lastResponse.ok) {
      logger.error('Upstream request failed', { status: lastResponse.status, statusText: lastResponse.statusText });
    }

    const resHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': isStream ? 'text/event-stream' : 'application/json'
    };

  if (isStream && lastResponse) {
    let stream = lastResponse.body;
    if (!stream) {
      throw new Error('Response body is null');
    }

    // Wrapper stream to capture token usage at stream end
    let tokenUsage: TokenUsage | null = null;
    const tokenCaptureStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      flush() {
        if (tokenUsage) {
          (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
            blobs: [
              'llm_api_tokens',
              requestedModel,
              providerName,
              'stream',
            ],
            doubles: [
              tokenUsage.prompt_tokens,
              tokenUsage.completion_tokens,
              tokenUsage.total_tokens,
            ],
            indexes: [apiKey],
          });
        }
      },
    });

    // Create a tee stream: one for parsing usage, one for the response
    const [streamForUsage, streamForResponse] = stream.tee();

    // Parse usage data from the stream in background
    (async () => {
      const reader = streamForUsage.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonStr = line.slice(6);
                const json = JSON.parse(jsonStr);
                // Anthropic streaming format: message_delta event contains usage
                if (json.type === 'message_delta' && json.usage) {
                  tokenUsage = {
                    prompt_tokens: json.usage.input_tokens || 0,
                    completion_tokens: json.usage.output_tokens || 0,
                    total_tokens: (json.usage.input_tokens || 0) + (json.usage.output_tokens || 0),
                  };
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (e) {
        // Ignore errors in usage extraction
      } finally {
        reader.releaseLock();
      }
    })();

    stream = streamForResponse.pipeThrough(upstreamProtocol.createToStandardStream(requestedModel));
    stream = stream.pipeThrough(clientProtocol.createFromStandardStream());
    stream = stream.pipeThrough(tokenCaptureStream);

    return new Response(stream, { headers: { ...resHeaders, 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
  } else if (lastResponse) {
    const upstreamJson = await lastResponse.json();
    const standardResponse = upstreamProtocol.toStandardResponse(upstreamJson, requestedModel);

    // Extract token usage from response
    const usage = standardResponse.usage;
    if (usage) {
      (env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
        blobs: [
          'llm_api_tokens',
          requestedModel,
          providerName,
          'non-stream',
        ],
        doubles: [
          usage.prompt_tokens || 0,
          usage.completion_tokens || 0,
          usage.total_tokens || 0,
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
    return createInternalErrorResponse((err as Error).message);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}
