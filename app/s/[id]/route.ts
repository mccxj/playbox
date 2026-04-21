import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

/**
 * GET /s/[id]
 * Redirects to the original URL stored in KV
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return new Response('Short URL not found', { status: 404 });
  }

  try {
    const { env } = getCloudflareContext() as any;
    const kv = env.PLAYBOX_KV;

    if (!kv) {
      return new Response('Service unavailable', { status: 503 });
    }

    const key = `short_url:${id}`;
    const data = await kv.get(key);

    if (!data) {
      return new Response('Short URL not found or expired', { status: 404 });
    }

    try {
      const parsed = JSON.parse(data);
      return Response.redirect(parsed.originalUrl, 302);
    } catch {
      return new Response('Invalid short URL', { status: 500 });
    }
  } catch (error) {
    console.error('Error resolving short URL:', error);
    return new Response('Service error', { status: 500 });
  }
}
