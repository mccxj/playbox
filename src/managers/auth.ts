import type { Env } from '../types';

export const AuthManager = {
  verify(request: Request, env: Env): boolean {
    let token: string | null = null;

    // Check Authorization header (Bearer)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
    // Check x-goog-api-key header
    else if (request.headers.get('x-goog-api-key')) {
      token = request.headers.get('x-goog-api-key')!.trim();
    }
    // Check x-api-key header
    else if (request.headers.get('x-api-key')) {
      token = request.headers.get('x-api-key')!.trim();
    }
    // Check URL query parameter
    else {
      const url = new URL(request.url);
      const keyParam = url.searchParams.get('key');
      if (keyParam) {
        token = keyParam.trim();
      }
    }

    // Compare with expected token
    const envVars = env as unknown as Record<string, string | undefined>;
    return token === envVars.AUTH_TOKEN;
  },
};
