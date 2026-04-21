/**
 * Authentication middleware utilities
 * Provides API key verification and unauthorized response creation
 */

import { CORS_HEADERS } from '../utils/constants';
import type { Env } from '../types';

export interface ApiKeyRecord {
  id: string;
  key_hash: string;
  name: string;
  expires_at: string | null;
  created_at: string;
  is_active: number;
  last_used_at: string | null;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToHex(hashBuffer);
}

export async function verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  const inputHash = await hashApiKey(apiKey);
  return inputHash === hashedKey;
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

  const db = (env as any).PLAYBOX_D1;
  if (!db) return false;

  const keyHash = await hashApiKey(apiKey);

  const result = await db.prepare('SELECT * FROM llm_api_keys WHERE key_hash = ? AND is_active = 1').bind(keyHash).first();

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
