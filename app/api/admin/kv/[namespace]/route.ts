import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';
import type { KVKeyInfo, KVListResponse } from '@/types/kv';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

/**
 * GET /api/admin/kv/{namespace}
 * Lists keys with pagination/prefix search
 * Query params: prefix, cursor, limit, page, pageSize
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ namespace: string }> }) {
  try {
    const { env } = getTypedContext();
    const { namespace } = await params;

    const kv = env[namespace as keyof typeof env];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || undefined;
    const cursor = url.searchParams.get('cursor') || undefined;
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));

    // Execute KV list operation
    const result = (await (kv as KVNamespace).list({ prefix, cursor, limit })) as {
      keys: { name: string; expiration?: number }[];
      list_complete: boolean;
      cursor?: string;
    };
    const keys: KVKeyInfo[] = result.keys.map((k) => ({
      name: k.name,
      expiration: k.expiration,
    }));

    const response: KVListResponse = {
      success: true,
      keys,
      list_complete: result.list_complete,
      cursor: result.cursor || undefined,
      prefix,
    };

    return createJsonResponse(response);
  } catch (error) {
    console.error('Error listing KV keys:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

/**
 * POST /api/admin/kv/{namespace}
 * Creates new key with optional TTL
 * Body: { key: string, value: string, expirationTtl?: number }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ namespace: string }> }) {
  try {
    const { env } = getTypedContext();
    const { namespace } = await params;

    const kv = env[namespace as keyof typeof env];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const body = (await request.json()) as { key: string; value: string; expirationTtl?: number };

    if (!body.key || body.value === undefined) {
      return createJsonResponse({ error: 'Key and value are required' }, 400);
    }

    const options: { expirationTtl?: number } = {};
    if (body.expirationTtl && body.expirationTtl > 0) {
      options.expirationTtl = body.expirationTtl;
    }

    await (kv as KVNamespace).put(body.key, body.value, options);

    return createJsonResponse(
      {
        success: true,
        key: body.key,
        message: `Key '${body.key}' created successfully`,
      },
      201
    );
  } catch (error) {
    console.error('Error creating KV key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

// Type declaration for Cloudflare request context
