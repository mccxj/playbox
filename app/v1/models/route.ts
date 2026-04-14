import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { authenticate } from '@/lib/auth';
import { createJsonResponse, createUnauthorizedResponse } from '@/lib/response-helpers';
import { getConfig } from '@/config';
import type { Env } from '@/types';

// Force dynamic rendering for API routes that use request headers
export const dynamic = 'force-dynamic';

interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
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

    // Detect protocol type from request headers
    // If anthropic-version header is present, treat as Anthropic protocol
    const anthropicVersion = request.headers.get('anthropic-version');
    const targetFamily = anthropicVersion ? 'anthropic' : 'openai';

    const modelsList: ModelInfo[] = [];
    for (const [providerName, providerData] of Object.entries(providers)) {
      const provider = providerData as any;

      // Skip Gemini models - they have their own endpoint at /v1beta/models
      if (provider.family === 'gemini') {
        continue;
      }

      // Only include models matching the detected protocol family
      if (provider.family !== targetFamily) {
        continue;
      }

      if (Array.isArray(provider.models)) {
        provider.models.forEach((modelId: string) =>
          modelsList.push({
            id: modelId,
            object: 'model',
            created: 1739116800,
            owned_by: providerName
          })
        );
      }
    }

    return createJsonResponse({
      object: 'list',
      data: modelsList
    });
  } catch (error) {
    console.error('Error in GET /v1/models:', error);
    return createJsonResponse({
      error: {
        message: 'Internal Server Error',
        type: 'internal_error'
      }
    }, 500);
  }
}