/**
 * Authentication middleware utilities
 * Provides API key verification and unauthorized response creation
 */

import { CORS_HEADERS } from '../utils/constants';
import type { Env } from '../types';

export interface ApiKeyRecord {
  id: string;
  api_key: string;
  name: string;
  expires_at: string | null;
  created_at: string;
  is_active: number;
  last_used_at: string | null;
}

export function extractApiKey(request: Request): string | null {
  return (
    request.headers.get('x-goog-api-key') ||
    request.headers.get('x-api-key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    null
  );
}

export async function authenticate(request: Request, env: Env): Promise<boolean> {
  const apiKey = extractApiKey(request);
  if (!apiKey) return false;

  const db = env.PLAYBOX_D1;
  if (!db) return false;

  const result = await db.prepare('SELECT * FROM llm_api_keys WHERE api_key = ? AND is_active = 1').bind(apiKey).first();

  if (!result) return false;

  const record = result as unknown as ApiKeyRecord;

  if (record.expires_at) {
    const now = new Date().toISOString();
    if (now > record.expires_at) return false;
  }

  await db.prepare('UPDATE llm_api_keys SET last_used_at = datetime("now") WHERE id = ?').bind(record.id).run();

  return true;
}

export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        message: 'Incorrect API key provided.',
        type: 'invalid_request_error',
      },
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}
