import { describe, it, expect, vi } from 'vitest';
import { authenticate, createUnauthorizedResponse, extractApiKey } from '../../../src/lib/auth';
import { createMockEnv, createTestHeaders } from '../../factories';

describe('Auth', () => {
  describe('extractApiKey', () => {
    it('should extract from x-api-key header', () => {
      const headers = new Headers();
      headers.set('x-api-key', 'test-key');
      const request = new Request('http://localhost/test', { headers });
      expect(extractApiKey(request)).toBe('test-key');
    });

    it('should extract from x-goog-api-key header', () => {
      const headers = new Headers();
      headers.set('x-goog-api-key', 'google-key');
      const request = new Request('http://localhost/test', { headers });
      expect(extractApiKey(request)).toBe('google-key');
    });

    it('should extract Bearer token from Authorization header', () => {
      const headers = new Headers();
      headers.set('Authorization', 'Bearer my-bearer-token');
      const request = new Request('http://localhost/test', { headers });
      expect(extractApiKey(request)).toBe('my-bearer-token');
    });

    it('should prioritize x-goog-api-key over x-api-key', () => {
      const headers = new Headers();
      headers.set('x-goog-api-key', 'google-key');
      headers.set('x-api-key', 'regular-key');
      const request = new Request('http://localhost/test', { headers });
      expect(extractApiKey(request)).toBe('google-key');
    });

    it('should return null when no API key header present', () => {
      const request = new Request('http://localhost/test');
      expect(extractApiKey(request)).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('should return true for valid API key in D1', async () => {
      const apiKey = 'valid-test-key';

      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'key-123',
          api_key: apiKey,
          name: 'Test Key',
          expires_at: null,
          created_at: '2024-01-01T00:00:00.000Z',
          is_active: 1,
          last_used_at: null,
        }),
        run: vi.fn().mockResolvedValue({}),
      };

      const headers = createTestHeaders(apiKey);
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: mockDb });

      const result = await authenticate(request, env);

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM llm_api_keys WHERE api_key = ? AND is_active = 1');
    });

    it('should return false for invalid API key', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const headers = createTestHeaders('invalid-key');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: mockDb });

      const result = await authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should return false for missing API key', async () => {
      const request = new Request('http://localhost/test');
      const env = createMockEnv();

      const result = await authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should return false for expired API key', async () => {
      const apiKey = 'expired-key';

      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'key-123',
          api_key: apiKey,
          name: 'Expired Key',
          expires_at: '2020-01-01T00:00:00.000Z',
          created_at: '2019-01-01T00:00:00.000Z',
          is_active: 1,
          last_used_at: null,
        }),
      };

      const headers = createTestHeaders(apiKey);
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: mockDb });

      const result = await authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should return false for inactive API key', async () => {
      const apiKey = 'inactive-key';

      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
      };

      const headers = createTestHeaders(apiKey);
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: mockDb });

      const result = await authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should return false when D1 database is not available', async () => {
      const headers = createTestHeaders('some-key');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: undefined });

      const result = await authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should update last_used_at after successful auth', async () => {
      const apiKey = 'used-key';

      const mockRun = vi.fn().mockResolvedValue({});

      const mockDb = {
        prepare: vi.fn().mockReturnThis().mockReturnThis().mockReturnThis().mockReturnThis(),
        bind: vi.fn().mockReturnThis().mockReturnThis().mockReturnThis().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: 'key-123',
          api_key: apiKey,
          name: 'Used Key',
          expires_at: null,
          created_at: '2024-01-01T00:00:00.000Z',
          is_active: 1,
          last_used_at: null,
        }),
        run: mockRun,
      };

      const headers = createTestHeaders(apiKey);
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ PLAYBOX_D1: mockDb });

      await authenticate(request, env);

      expect(mockRun).toHaveBeenCalled();
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('should return 401 response', () => {
      const response = createUnauthorizedResponse();

      expect(response.status).toBe(401);
    });

    it('should return JSON content type', () => {
      const response = createUnauthorizedResponse();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createUnauthorizedResponse();

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });

    it('should have correct error structure', async () => {
      const response = createUnauthorizedResponse();
      const body = await response.json();

      expect((body as any).error.message).toBe('Incorrect API key provided.');
      expect((body as any).error.type).toBe('invalid_request_error');
    });
  });
});
