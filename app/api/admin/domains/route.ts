import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const { env } = getCloudflareContext() as any;
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const keyResult = await db.prepare(`SELECT content FROM security_keys WHERE type = 'API_KEY' AND provider = 'DIGITAL' LIMIT 1`).first();

    if (!keyResult) {
      return createJsonResponse({ error: 'DIGITAL API key not found' }, 404);
    }

    const apiKey = (keyResult as any).content;

    const response = await fetch('https://domain-api.digitalplat.org/api/v1/domains', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return createJsonResponse({ error: `Domain API returned ${response.status}: ${response.statusText}` }, response.status);
    }

    const data = (await response.json()) as { data?: unknown[] };

    return createJsonResponse({
      success: true,
      data: data.data || [],
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
