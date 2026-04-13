import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ namespace: string }> }) {
  try {
    const { env } = getRequestContext() as any;
    const { namespace } = await params;

    const kv = env[namespace];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const body = await request.json() as { operation: 'delete'; keys: string[] };

    if (body.operation !== 'delete' || !Array.isArray(body.keys)) {
      return createJsonResponse({ error: 'Invalid operation. Expected { operation: "delete", keys: string[] }' }, 400);
    }

    if (body.keys.length === 0) {
      return createJsonResponse({ error: 'No keys provided' }, 400);
    }

    let processed = 0;

    for (const key of body.keys) {
      await kv.delete(key);
      processed++;
    }

    return createJsonResponse({
      success: true,
      message: `Deleted ${processed} keys`,
      processed
    });
  } catch (error) {
    console.error('Error in batch operation:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
