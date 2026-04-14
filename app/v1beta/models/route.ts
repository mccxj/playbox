import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { authenticate } from '@/lib/auth';
import { createJsonResponse, createUnauthorizedResponse } from '@/lib/response-helpers';
import { getConfig } from '@/config';
import type { Env } from '@/types';

export const dynamic = 'force-dynamic';

interface GeminiModel {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
}

interface GeminiModelsResponse {
  models: GeminiModel[];
  nextPageToken?: string;
}

export async function GET(request: NextRequest) {
	const { env: rawEnv } = getCloudflareContext();
  const env = rawEnv as unknown as Env;

  if (!authenticate(request as any, env)) {
    return createUnauthorizedResponse();
  }

  try {
    const config = getConfig(env);
    const providers = config.providers;

    const modelsList: GeminiModel[] = [];

    for (const [, providerData] of Object.entries(providers)) {
      if ((providerData as any).family !== 'gemini') {
        continue;
      }

      if (Array.isArray((providerData as any).models)) {
        (providerData as any).models.forEach((modelId: string) => {
          modelsList.push({
            name: `models/${modelId}`,
            baseModelId: modelId.split('-').slice(0, -1).join('-') || modelId,
            version: '1.0',
            displayName: modelId,
            description: `Gemini model: ${modelId}`,
            inputTokenLimit: 1048576,
            outputTokenLimit: 8192,
            supportedGenerationMethods: ['generateContent'],
          });
        });
      }
    }

    const response: GeminiModelsResponse = {
      models: modelsList,
    };

    return createJsonResponse(response);
  } catch (error) {
    console.error('Error in GET /v1beta/models:', error);
    return createJsonResponse({
      error: {
        message: 'Internal Server Error',
        type: 'internal_error',
      },
    }, 500);
  }
}
