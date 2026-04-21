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

function buildAliasMap(providers: Record<string, any>): Map<string, string> {
  const aliasToReal = new Map<string, string>();
  for (const [, provider] of Object.entries(providers)) {
    if (provider.modelAliases) {
      for (const [alias, realModel] of Object.entries(provider.modelAliases)) {
        aliasToReal.set(alias, realModel as string);
      }
    }
  }
  return aliasToReal;
}

function getDisplayId(modelId: string, aliasMap: Map<string, string>): string {
  for (const [alias, realModel] of aliasMap) {
    if (realModel === modelId) {
      return alias;
    }
  }
  return modelId;
}

export async function GET(request: NextRequest) {
  const { env: rawEnv } = getCloudflareContext();
  const env = rawEnv as unknown as Env;

  if (!(await authenticate(request as any, env))) {
    return createUnauthorizedResponse();
  }

  try {
    const config = getConfig(env);
    const providers = config.providers;

    const aliasMap = buildAliasMap(providers);
    const modelsList: GeminiModel[] = [];
    const seenIds = new Set<string>();

    for (const [, providerData] of Object.entries(providers)) {
      if ((providerData as any).family !== 'gemini') {
        continue;
      }

      if (Array.isArray((providerData as any).models)) {
        (providerData as any).models.forEach((modelId: string) => {
          const displayId = getDisplayId(modelId, aliasMap);
          if (!seenIds.has(displayId)) {
            seenIds.add(displayId);
            modelsList.push({
              name: `models/${displayId}`,
              baseModelId: displayId.split('-').slice(0, -1).join('-') || displayId,
              version: '1.0',
              displayName: displayId,
              description: `Gemini model: ${displayId}`,
              inputTokenLimit: 1048576,
              outputTokenLimit: 8192,
              supportedGenerationMethods: ['generateContent'],
            });
          }
        });
      }
    }

    const response: GeminiModelsResponse = {
      models: modelsList,
    };

    return createJsonResponse(response);
  } catch (error) {
    console.error('Error in GET /v1beta/models:', error);
    return createJsonResponse(
      {
        error: {
          message: 'Internal Server Error',
          type: 'internal_error',
        },
      },
      500
    );
  }
}
