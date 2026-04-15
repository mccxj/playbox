import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyManager } from '../../../src/managers/key';
import { createMockEnv, createMockExecutionContext, createMockProviderConfig } from '../../factories';

describe('KeyManager', () => {
  let mockEnv: ReturnType<typeof createMockEnv>;
  let mockCtx: ReturnType<typeof createMockExecutionContext>;
  let mockProvider: ReturnType<typeof createMockProviderConfig>;

  beforeEach(() => {
    mockEnv = createMockEnv();
    mockCtx = createMockExecutionContext();
    mockProvider = createMockProviderConfig({
      type: 'openai',
      key: 'test-provider',
    });
  });

  describe('getValidAccessToken', () => {
    it('should return cached token if still valid', async () => {
      const cachedToken = {
        accessToken: 'cached-access-token',
        expiresAt: Date.now() + 3600000,
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(cachedToken);

      const token = await KeyManager.getValidAccessToken(mockEnv, 'GeminiCli', mockCtx);

      expect(token).toBe('cached-access-token');
      expect(mockEnv.PLAYBOX_KV.get).toHaveBeenCalledWith('gemini_cli_access_token', { type: 'json' });
    });

    it('should return valid token after refresh', async () => {
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{
              content: JSON.stringify({
                client_id: 'test-client-id',
                client_secret: 'test-client-secret',
                refresh_token: 'test-refresh-token'
              })
            }]
          })
        })
      } as any;

      const token = await KeyManager.getValidAccessToken(mockEnv, 'GeminiCli', mockCtx);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should cache new token with correct TTL', async () => {
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_KV.put = vi.fn().mockResolvedValue(undefined);
      mockEnv.PLAYBOX_D1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{
              content: JSON.stringify({
                client_id: 'test-client-id',
                client_secret: 'test-client-secret',
                refresh_token: 'test-refresh-token'
              })
            }]
          })
        })
      } as any;

      await KeyManager.getValidAccessToken(mockEnv, 'GeminiCli', mockCtx);

      const putCalls = mockEnv.PLAYBOX_KV.put.mock.calls;
      const accessTokenPut = putCalls.find((call: any[]) => call[0] === 'gemini_cli_access_token');
      expect(accessTokenPut).toBeDefined();
      expect(accessTokenPut[2]).toEqual({ expirationTtl: 3500 });
    });
  });

  describe('refreshGeminiAccessToken', () => {
    it('should refresh token from Google OAuth', async () => {
      mockEnv.PLAYBOX_D1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{
              content: JSON.stringify({
                client_id: 'test-client-id',
                client_secret: 'test-client-secret',
                refresh_token: 'test-refresh-token'
              })
            }]
          })
        })
      } as any;

      const tokenCache = await KeyManager.refreshGeminiAccessToken(mockEnv, 'GeminiCli', mockCtx);

      expect(tokenCache).toHaveProperty('accessToken');
      expect(tokenCache).toHaveProperty('expiresAt');
      expect(tokenCache.accessToken).toBe('mock-refreshed-token');
    });
  });

  describe('getRandomOAuthCredentials', () => {
    it('should return cached credentials if available', async () => {
      const cachedCreds = [
        { client_id: 'cached-id', client_secret: 'cached-secret', refresh_token: 'cached-token' }
      ];
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(cachedCreds);

      const creds = await KeyManager.getRandomOAuthCredentials(mockEnv, 'GeminiCli', mockCtx);

      expect(creds).toEqual(cachedCreds[0]);
      expect(mockEnv.PLAYBOX_KV.get).toHaveBeenCalledWith('oauth_cache_GeminiCli', { type: 'json' });
    });

    it('should fetch credentials from D1 when cache is empty', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [
              { content: JSON.stringify({ client_id: 'id1', client_secret: 'secret1', refresh_token: 'token1' }) },
              { content: JSON.stringify({ client_id: 'id2', client_secret: 'secret2', refresh_token: 'token2' }) },
            ],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      const creds = await KeyManager.getRandomOAuthCredentials(mockEnv, 'GeminiCli', mockCtx);

      expect(creds).toHaveProperty('client_id');
      expect(creds).toHaveProperty('client_secret');
      expect(creds).toHaveProperty('refresh_token');
      expect(['id1', 'id2']).toContain(creds.client_id);
    });

    it('should throw error when no OAuth credentials found', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      await expect(KeyManager.getRandomOAuthCredentials(mockEnv, 'UnknownProvider', mockCtx)).rejects.toThrow(
        'No OAuth credentials found for provider: UnknownProvider'
      );
    });

    it('should cache credentials with correct TTL', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [
              { content: JSON.stringify({ client_id: 'test-id', client_secret: 'test-secret', refresh_token: 'test-token' }) },
            ],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_KV.put = vi.fn().mockResolvedValue(undefined);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      await KeyManager.getRandomOAuthCredentials(mockEnv, 'GeminiCli', mockCtx);

      expect(mockCtx.waitUntil).toHaveBeenCalled();
      const putCall = mockEnv.PLAYBOX_KV.put.mock.calls.find((call: any[]) => call[0] === 'oauth_cache_GeminiCli');
      expect(putCall).toBeDefined();
      expect(putCall[2]).toEqual({ expirationTtl: 300 });
    });

    it('should handle invalid cached data gracefully', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [
              { content: JSON.stringify({ client_id: 'fresh-id', client_secret: 'fresh-secret', refresh_token: 'fresh-token' }) },
            ],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      const creds = await KeyManager.getRandomOAuthCredentials(mockEnv, 'GeminiCli', mockCtx);

      expect(creds.client_id).toBe('fresh-id');
    });
  });

  describe('getRandomApiKey', () => {
    it('should return random key from D1 when cache is empty', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [
              { content: 'key-1' },
              { content: 'key-2' },
              { content: 'key-3' },
            ],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      const key = await KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx);

      expect(['key-1', 'key-2', 'key-3']).toContain(key);
    });

    it('should use cached keys when available', async () => {
      const cachedKeys = ['cached-key-1', 'cached-key-2', 'cached-key-3'];
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(cachedKeys);

      const key = await KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx);

      expect(cachedKeys).toContain(key);
    });

    it('should cache keys with correct TTL', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{ content: 'new-key' }],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_KV.put = vi.fn().mockResolvedValue(undefined);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      await KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx);

      expect(mockCtx.waitUntil).toHaveBeenCalled();
    });

    it('should throw error when no keys found', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      await expect(KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx)).rejects.toThrow(
        'No API keys found for provider: test-provider'
      );
    });

    it('should handle invalid cached data gracefully', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{ content: 'fresh-key' }],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      const key = await KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx);

      expect(key).toBe('fresh-key');
    });

    it('should query correct provider key', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{ content: 'provider-key' }],
          }),
        }),
      };
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(null);
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      await KeyManager.getRandomApiKey(mockEnv, mockProvider, mockCtx);

      expect(mockD1.prepare).toHaveBeenCalledWith(expect.stringContaining('security_keys'));
    });
  });
});
