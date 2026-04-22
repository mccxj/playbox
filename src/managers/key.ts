import type { Env } from '../types';

interface Provider {
  key: string;
  type: string;
  endpoint: string;
  models: string[];
}

interface ExecutionContext {
  waitUntil(promise: Promise<void>): void;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export const KeyManager = {
  async getRandomOAuthCredentials(env: Env, provider: string, ctx: ExecutionContext): Promise<OAuthCredentials> {
    const cacheKey = `oauth_cache_${provider}`;

    // Try to get from KV cache first
    let credList = (await env.PLAYBOX_KV.get(cacheKey, { type: 'json' })) as OAuthCredentials[] | null;

    if (!credList || !Array.isArray(credList) || credList.length === 0) {
      // Fetch from D1 database
      const query = `SELECT content FROM security_keys WHERE type = 'OAUTH_JSON' AND provider = ? ORDER BY RANDOM() LIMIT 100`;
      const { results } = await env.PLAYBOX_D1.prepare(query).bind(provider).all();

      if (!results || results.length === 0) {
        throw new Error(`No OAuth credentials found for provider: ${provider}`);
      }

      credList = results.map((row: Record<string, unknown>) => {
        const typedRow = row as unknown as { content: string };
        return JSON.parse(typedRow.content) as OAuthCredentials;
      });

      // Cache with 300s TTL
      ctx.waitUntil(env.PLAYBOX_KV.put(cacheKey, JSON.stringify(credList), { expirationTtl: 300 }));
    }

    // Return random credentials
    return credList[Math.floor(Math.random() * credList.length)];
  },

  async refreshGeminiAccessToken(env: Env, provider: string, ctx: ExecutionContext): Promise<TokenCache> {
    const credentials = await this.getRandomOAuthCredentials(env, provider, ctx);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': 'google-api-nodejs-client/10.5.0',
        'x-goog-api-client': 'gl-node/24.14.0',
      },
      body: new URLSearchParams({
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`刷新凭证失败：${errorText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    console.warn(
      `Token Refresh: ${JSON.stringify({ access_token: '***', expires_in: (data as { access_token: string; expires_in: number }).expires_in })}`
    );

    return {
      accessToken: (data as { access_token: string; expires_in: number }).access_token,
      expiresAt: Date.now() + (data as { access_token: string; expires_in: number }).expires_in * 1000,
    };
  },

  async getValidAccessToken(env: Env, provider: string, ctx: ExecutionContext): Promise<string> {
    const cached = (await env.PLAYBOX_KV.get('gemini_cli_access_token', { type: 'json' })) as TokenCache | null;

    if (cached && cached.expiresAt > Date.now() + 60 * 1000) {
      return cached.accessToken;
    }

    const newToken = await this.refreshGeminiAccessToken(env, provider, ctx);

    ctx.waitUntil(env.PLAYBOX_KV.put('gemini_cli_access_token', JSON.stringify(newToken), { expirationTtl: 3500 }));

    return newToken.accessToken;
  },

  async getRandomApiKey(env: Env, provider: Provider, ctx: ExecutionContext): Promise<string> {
    const providerKey = provider.key.trim();
    const cacheKey = `keys_cache_${providerKey}`;

    // Try to get from KV cache first
    let keyList = (await env.PLAYBOX_KV.get(cacheKey, { type: 'json' })) as string[] | null;

    if (!keyList || !Array.isArray(keyList) || keyList.length === 0) {
      // Fetch from D1 database
      const query = `SELECT content FROM security_keys WHERE type = 'API_KEY' AND provider = ? ORDER BY RANDOM() LIMIT 100`;
      const { results } = await env.PLAYBOX_D1.prepare(query).bind(providerKey).all();

      if (!results || results.length === 0) {
        throw new Error(`No API keys found for provider: ${providerKey}`);
      }

      keyList = results.map((row: Record<string, unknown>) => {
        const typedRow = row as unknown as { content: string };
        return typedRow.content;
      });

      // Cache with 300s TTL
      ctx.waitUntil(env.PLAYBOX_KV.put(cacheKey, JSON.stringify(keyList), { expirationTtl: 300 }));
    }

    // Return random key
    return keyList[Math.floor(Math.random() * keyList.length)];
  },
};
