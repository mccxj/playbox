import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

const SHORT_URL_TTL = 600; // 10 minutes in seconds

/**
 * Generate a short random ID
 */
function generateShortId(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * GET /api/admin/short-url
 * Lists all short URLs from KV (no pagination needed per requirements - no logging)
 */
export async function GET(_request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const kv = env.PLAYBOX_KV;

    if (!kv) {
      return createInternalErrorResponse('KV not configured');
    }

    const list = await kv.list({ prefix: 'short_url:', limit: 1000 });
    const urls: { id: string; originalUrl: string; createdAt: string }[] = [];

    for (const key of list.keys) {
      const value = await kv.get(key.name);
      if (value) {
        try {
          const data = JSON.parse(value);
          urls.push({
            id: data.id,
            originalUrl: data.originalUrl,
            createdAt: data.createdAt,
          });
        } catch {
          // Skip invalid entries
        }
      }
    }

    return createJsonResponse({
      success: true,
      urls: urls.reverse(), // Most recent first
    });
  } catch (error) {
    console.error('Error listing short URLs:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

/**
 * POST /api/admin/short-url
 * Creates a new short URL
 * Body: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const kv = env.PLAYBOX_KV;

    if (!kv) {
      return createInternalErrorResponse('KV not configured');
    }

    const body = (await request.json()) as { url: string };

    if (!body.url) {
      return createJsonResponse({ error: 'URL is required' }, 400);
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return createJsonResponse({ error: 'Invalid URL format' }, 400);
    }

    const id = generateShortId();
    const data = {
      id,
      originalUrl: body.url,
      createdAt: new Date().toISOString(),
    };

    await kv.put(`short_url:${id}`, JSON.stringify(data), {
      expirationTtl: SHORT_URL_TTL,
    });

    return createJsonResponse(
      {
        success: true,
        id,
        shortUrl: `/s/${id}`,
        originalUrl: body.url,
        expiresIn: SHORT_URL_TTL,
        qrUrl: `/api/short-url/${id}/qr`,
      },
      201
    );
  } catch (error) {
    console.error('Error creating short URL:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

/**
 * DELETE /api/admin/short-url
 * Deletes a short URL by ID
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const kv = env.PLAYBOX_KV;

    if (!kv) {
      return createInternalErrorResponse('KV not configured');
    }

    const body = (await request.json()) as { id: string };

    if (!body.id) {
      return createJsonResponse({ error: 'ID is required' }, 400);
    }

    const key = `short_url:${body.id}`;
    const existing = await kv.get(key);

    if (!existing) {
      return createNotFoundResponse('Short URL not found');
    }

    await kv.delete(key);

    return createJsonResponse({
      success: true,
      message: 'Short URL deleted',
    });
  } catch (error) {
    console.error('Error deleting short URL:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
