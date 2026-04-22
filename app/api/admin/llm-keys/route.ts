import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { env } = getCloudflareContext() as any;
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const result = await db
      .prepare(
        `
      SELECT id, api_key, name, expires_at, created_at, is_active, last_used_at
      FROM llm_api_keys
      ORDER BY created_at DESC
    `
      )
      .all();

    const keys = result.results.map((row: any) => ({
      id: row.id,
      name: row.name,
      api_key: row.api_key,
      expires_at: row.expires_at,
      created_at: row.created_at,
      is_active: row.is_active === 1,
      last_used_at: row.last_used_at,
    }));

    return createJsonResponse({ success: true, keys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext() as any;
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const body = (await request.json()) as { name?: string; expires_at?: string };
    const { name, expires_at } = body;

    if (!name || typeof name !== 'string') {
      return createJsonResponse({ error: 'Name is required' }, 400);
    }

    const apiKey = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const id = crypto.randomUUID();

    let insertQuery = `
      INSERT INTO llm_api_keys (id, api_key, name, created_at, is_active)
      VALUES (?, ?, ?, datetime('now'), 1)
    `;
    let bindParams: any[] = [id, apiKey, name];

    if (expires_at) {
      insertQuery = `
        INSERT INTO llm_api_keys (id, api_key, name, expires_at, created_at, is_active)
        VALUES (?, ?, ?, ?, datetime('now'), 1)
      `;
      bindParams = [id, apiKey, name, expires_at];
    }

    await db
      .prepare(insertQuery)
      .bind(...bindParams)
      .run();

    return createJsonResponse(
      {
        success: true,
        key: {
          id,
          name,
          api_key: apiKey,
          expires_at: expires_at || null,
          created_at: new Date().toISOString(),
          is_active: true,
        },
      },
      201
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
