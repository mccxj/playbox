import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createNotFoundResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = getTypedContext();
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const { id } = await params;

    const result = await db
      .prepare(
        `
      SELECT id, name, expires_at, created_at, is_active, last_used_at
      FROM llm_api_keys
      WHERE id = ?
    `
      )
      .bind(id)
      .first();

    if (!result) {
      return createNotFoundResponse('API key not found');
    }

    return createJsonResponse({
      success: true,
      key: {
        id: result.id,
        name: result.name,
        expires_at: result.expires_at,
        created_at: result.created_at,
        is_active: result.is_active === 1,
        last_used_at: result.last_used_at,
      },
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { env } = getTypedContext();
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const { id } = await params;

    const existing = await db.prepare('SELECT id FROM llm_api_keys WHERE id = ?').bind(id).first();
    if (!existing) {
      return createNotFoundResponse('API key not found');
    }

    await db.prepare('DELETE FROM llm_api_keys WHERE id = ?').bind(id).run();

    return createJsonResponse({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
