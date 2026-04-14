import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { authenticate } from '@/lib/auth';
import { createUnauthorizedResponse } from '@/lib/response-helpers';
import { getConfig, resolveProvider } from '@/config';
import { ProtocolFactory } from '@/protocols';
import type { Env } from '@/types';
import { CORS_HEADERS } from '@/utils/constants';
import { createLogger } from '@/utils/logger';

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

interface ChatBody {
  model: string;
  stream?: boolean;
  store?: any;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  const logger = createLogger();

	const { env: rawEnv, ctx } = getCloudflareContext();
  const env = rawEnv as unknown as Env;

  const authResult = authenticate(request as any, env);
  if (!authResult) {
    return createUnauthorizedResponse();
  }

  // Check debug mode from URL query parameter or header
  const url = new URL(request.url);
  const debugParam = url.searchParams.get('debug');
  const debugHeader = request.headers.get('x-debug');
  const isDebug = debugParam === 'true' || debugParam === '1' || debugHeader === 'true' || debugHeader === '1';

  try {
    const rawBody = await request.json() as ChatBody;
    delete rawBody.store;

    const requestedModel = rawBody.model;
    const isStream = !isDebug && rawBody.stream === true;

	const config = getConfig(env);
	const { name: providerName, provider } = resolveProvider(config, requestedModel, 'openai');
	if (!provider) {
		throw new Error(`No provider found for model: ${requestedModel}`);
	}

	if (provider.family !== 'openai') {
		throw new Error(`Chat completions endpoint only supports 'openai' family providers. Got: ${provider.family} (provider: ${providerName})`);
	}

	logger.info('Request routed', { model: requestedModel, isStream, providerName, providerType: provider.type });

	// Record analytics data point (async, non-blocking)
	const apiKey = request.headers.get('x-api-key') || request.headers.get('Authorization')?.replace('Bearer ', '') || 'anonymous';
	(env as unknown as { PLAYBOX_EVENTS?: AnalyticsEngineDataset }).PLAYBOX_EVENTS?.writeDataPoint({
		blobs: [
			'llm_api',                    // blob1: fixed tag for filtering
			'/v1/chat/completions',       // blob2: request path
			requestedModel,               // blob3: model name
			isStream ? 'stream' : 'non-stream', // blob4: stream type
			providerName,                 // blob5: provider name
		],
		indexes: [apiKey], // index for sampling
	});

	const clientProtocol = ProtocolFactory.get('openai');
	const upstreamProtocol = ProtocolFactory.get(provider.type);

    const standardRequest = clientProtocol.toStandardRequest(rawBody);
    const upstreamRequest = upstreamProtocol.fromStandardRequest(standardRequest);

    const MAX_ATTEMPTS = upstreamProtocol.getAttempt();
    let lastResponse: Response | undefined;

	let fetchUrl = '';
	let fetchHeaders: Record<string, string> = {};
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		const apiKey = await upstreamProtocol.getApiKey(env, provider, ctx);
		fetchUrl = await upstreamProtocol.getEndpoint(provider, requestedModel, isStream, apiKey);
		fetchHeaders = await upstreamProtocol.getHeaders(provider, env, ctx, apiKey);
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
        // Record token analytics when stream ends
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
          // Try to extract usage from final chunks
          // OpenAI format: last chunk before [DONE] contains usage
          // Anthropic format: message_delta event contains usage
          // Google/Gemini: check for usageMetadata in final response
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const jsonStr = line.slice(6);
                const json = JSON.parse(jsonStr);
                // OpenAI streaming format (stream_options.include_usage)
                if (json.usage) {
                  tokenUsage = {
                    prompt_tokens: json.usage.prompt_tokens || 0,
                    completion_tokens: json.usage.completion_tokens || 0,
                    total_tokens: json.usage.total_tokens || 0,
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

    return new Response(stream, {
      headers: { ...resHeaders, 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
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
					body: upstreamJson
				},
				provider: {
					name: providerName,
					type: provider.type
				},
				model: requestedModel
			};
			return new Response(JSON.stringify(debugResponse, null, 2), {
				headers: { ...resHeaders, 'Content-Type': 'application/json' }
			});
		}

		const standardResponse = upstreamProtocol.toStandardResponse(upstreamJson, requestedModel);
    
    // Extract token usage from response
    const usage = standardResponse.usage;
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
    return new Response(
      JSON.stringify({ error: { message: (err as Error).message } }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      }
    );
  }
}
