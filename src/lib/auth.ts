/**
 * Authentication middleware utilities
 * Provides API key verification and unauthorized response creation
 */

import { CORS_HEADERS } from '../utils/constants';
import type { Env } from '../types';

/**
 * Authenticate request by verifying API key
 * Checks for x-api-key header or Authorization: Bearer header
 *
 * @param request - The incoming request
 * @param env - Environment bindings including AUTH_TOKEN
 * @returns boolean indicating if authentication succeeded
 */
export function authenticate(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('x-goog-api-key') || request.headers.get('x-api-key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  const envVars = env as unknown as Record<string, string | undefined>;
  const expectedKey = envVars.AUTH_TOKEN || 'sk-1234';
  return apiKey === expectedKey;
}

/**
 * Create 401 Unauthorized response with JSON error body
 *
 * @returns Response with 401 status and JSON error message
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        message: 'Incorrect API key provided.',
        type: 'invalid_request_error'
      }
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    }
  );
}