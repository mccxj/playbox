/**
 * Authentication middleware utilities
 * Provides API key verification and unauthorized response creation
 */

import { CORS_HEADERS } from '../utils/constants';
import type { Env } from '../types';
import { createStorageAdapters } from '../storage/factory';

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

  const adapters = createStorageAdapters(env);
  const db = adapters.d1;

  const result = await db.query(
    'SELECT * FROM llm_api_keys WHERE api_key = ? AND is_active = 1',
    [apiKey]
  );

  if (!result.results || result.results.length === 0) return false;

  const record = result.results[0] as unknown as ApiKeyRecord;

  if (record.expires_at) {
    const now = new Date().toISOString();
    if (now > record.expires_at) return false;
  }

  await db.execute(
    'UPDATE llm_api_keys SET last_used_at = datetime("now") WHERE id = ?',
    [record.id]
  );

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
