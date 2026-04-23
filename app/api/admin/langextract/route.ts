import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';
import { extract, ExampleData } from 'langextract';

export const dynamic = 'force-dynamic';

interface ExtractBody {
  text: string;
  promptDescription: string;
  examples?: ExampleData[];
  modelType: 'gemini' | 'openai' | 'ollama';
  modelId?: string;
  apiKey?: string;
  temperature?: number;
  extractionPasses?: number;
  maxCharBuffer?: number;
  maxTokens?: number;
  useSchemaConstraints?: boolean;
}

async function resolveApiKey(db: any, modelType: string, providedKey?: string): Promise<string | undefined> {
  if (providedKey) return providedKey;

  const envKey =
    modelType === 'gemini'
      ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.LANGEXTRACT_API_KEY
      : modelType === 'openai'
        ? process.env.OPENAI_API_KEY
        : undefined;
  if (envKey) return envKey;

  if (db) {
    try {
      const stored = await db
        .prepare(`SELECT content FROM security_keys WHERE type = 'API_KEY' AND provider = ? LIMIT 1`)
        .bind(modelType)
        .first();
      if (stored?.content) return stored.content;
    } catch {}
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext() as any;
    const db = env.PLAYBOX_D1;

    const body = (await request.json()) as ExtractBody;
    const {
      text,
      promptDescription,
      examples = [],
      modelType,
      modelId,
      apiKey: providedKey,
      temperature = 0.3,
      extractionPasses = 1,
      maxCharBuffer = 1000,
      maxTokens = 2048,
      useSchemaConstraints = false,
    } = body;

    if (!text || !promptDescription) {
      return createJsonResponse({ success: false, error: 'text and promptDescription are required' }, 400);
    }

    if (!modelType) {
      return createJsonResponse({ success: false, error: 'modelType is required (gemini, openai, or ollama)' }, 400);
    }

    const apiKey = await resolveApiKey(db, modelType, providedKey);

    const extractOptions: Record<string, unknown> = {
      promptDescription,
      examples,
      modelType,
      temperature,
      extractionPasses,
      maxCharBuffer,
      maxTokens,
      useSchemaConstraints,
    };

    if (apiKey) extractOptions.apiKey = apiKey;
    if (modelId) extractOptions.modelId = modelId;

    if (modelType === 'ollama' && process.env.OLLAMA_BASE_URL) {
      extractOptions.modelUrl = process.env.OLLAMA_BASE_URL;
    }
    if (modelType === 'openai' && process.env.OPENAI_BASE_URL) {
      extractOptions.baseURL = process.env.OPENAI_BASE_URL;
    }

    const result = await extract(text, extractOptions);

    const annotated = Array.isArray(result) ? result[0] : result;

    return createJsonResponse({
      success: true,
      data: {
        extractions: annotated.extractions || [],
        text: annotated.text,
        documentId: annotated.documentId,
      },
    });
  } catch (error) {
    console.error('LangExtract error:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function GET() {
  try {
    const supportedProviders = [
      {
        type: 'gemini',
        label: 'Google Gemini',
        defaultModel: 'gemini-2.5-flash',
        envVar: 'GEMINI_API_KEY',
      },
      {
        type: 'openai',
        label: 'OpenAI',
        defaultModel: 'gpt-4o-mini',
        envVar: 'OPENAI_API_KEY',
      },
      {
        type: 'ollama',
        label: 'Ollama (Local)',
        defaultModel: 'llama3.2',
        envVar: null,
      },
    ];

    return createJsonResponse({
      success: true,
      data: { supportedProviders },
    });
  } catch (error) {
    return createInternalErrorResponse((error as Error).message);
  }
}
