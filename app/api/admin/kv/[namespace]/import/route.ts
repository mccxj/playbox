import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ namespace: string }> }) {
  try {
    const { env } = getCloudflareContext() as any;
    const { namespace } = await params;

    const kv = env[namespace];

    if (!kv) {
      return createNotFoundResponse(`KV namespace '${namespace}' not found`);
    }

    const body = (await request.json()) as {
      items: Array<{ key: string; value: string; expirationTtl?: number }>;
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return createJsonResponse({ error: 'Invalid data. Expected { items: Array<{ key, value, expirationTtl? }> }' }, 400);
    }

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of body.items) {
      try {
        if (!item.key || item.value === undefined) {
          errors.push(`Missing key or value for item ${processed + failed + 1}`);
          failed++;
          continue;
        }

        const options: { expirationTtl?: number } = {};
        if (item.expirationTtl && item.expirationTtl > 0) {
          options.expirationTtl = item.expirationTtl;
        }

        await kv.put(item.key, item.value, options);
        processed++;
      } catch (err) {
        errors.push(`Failed to import key '${item.key}': ${(err as Error).message}`);
        failed++;
      }
    }

    return createJsonResponse(
      {
        success: true,
        message: `Imported ${processed} keys${failed > 0 ? `, ${failed} failed` : ''}`,
        processed,
        failed: failed > 0 ? failed : undefined,
        errors: errors.length > 0 ? errors : undefined,
      },
      201
    );
  } catch (error) {
    console.error('Error importing KV keys:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
