import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ namespace: string; key: string }> }) {
  try {
    const { env } = getTypedContext();
    const { namespace, key } = await params;

    const kv = env[namespace as keyof typeof env];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const decodedKey = decodeURIComponent(key);
    const { value, metadata } = await (kv as KVNamespace).getWithMetadata(decodedKey);

    if (value === null) {
      return createNotFoundResponse(`Key '${decodedKey}' not found`);
    }

    return createJsonResponse({
      success: true,
      key: decodedKey,
      value,
      metadata: metadata || undefined,
    });
  } catch (error) {
    console.error('Error getting KV key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ namespace: string; key: string }> }) {
  try {
    const { env } = getTypedContext();
    const { namespace, key } = await params;

    const kv = env[namespace as keyof typeof env];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const decodedKey = decodeURIComponent(key);
    const body = (await request.json()) as { value: string; expirationTtl?: number };

    if (body.value === undefined) {
      return createJsonResponse({ error: 'Value is required' }, 400);
    }

    const options: { expirationTtl?: number } = {};
    if (body.expirationTtl && body.expirationTtl > 0) {
      options.expirationTtl = body.expirationTtl;
    }

    await (kv as KVNamespace).put(decodedKey, body.value, options);

    return createJsonResponse({
      success: true,
      key: decodedKey,
      message: `Key '${decodedKey}' updated successfully`,
    });
  } catch (error) {
    console.error('Error updating KV key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ namespace: string; key: string }> }) {
  try {
    const { env } = getTypedContext();
    const { namespace, key } = await params;

    const kv = env[namespace as keyof typeof env];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const decodedKey = decodeURIComponent(key);
    await (kv as KVNamespace).delete(decodedKey);

    return createJsonResponse({
      success: true,
      message: `Key '${decodedKey}' deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting KV key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
