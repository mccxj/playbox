import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareKVAdapter } from '../../../../src/storage/cloudflare/kv';
import type { MockEnv } from '../../../../test/factories';

describe('CloudflareKVAdapter', () => {
  let mockEnv: MockEnv;
  let adapter: CloudflareKVAdapter;

  beforeEach(() => {
    mockEnv = {
      AUTH_TOKEN: 'test-token',
      PLAYBOX_KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      PLAYBOX_D1: {
        prepare: vi.fn(),
        batch: vi.fn(),
      },
      GEMINI_CLI_CLIENT_ID: 'test-client-id',
      GEMINI_CLI_CLIENT_SECRET: 'test-client-secret',
      GEMINI_CLI_REFRESH_TOKEN: 'test-refresh-token',
      API_CONFIG: undefined,
      fetch: vi.fn(),
    } as MockEnv;

    adapter = new CloudflareKVAdapter(mockEnv);
  });

  describe('get', () => {
    it('should call PLAYBOX_KV.get with the provided key', async () => {
      const mockValue = 'test-value';
      mockEnv.PLAYBOX_KV.get.mockResolvedValueOnce(mockValue);

      const result = await adapter.get('test-key');

      expect(mockEnv.PLAYBOX_KV.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockValue);
    });

    it('should return null when key does not exist', async () => {
      mockEnv.PLAYBOX_KV.get.mockResolvedValueOnce(null);

      const result = await adapter.get('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('put', () => {
    it('should call PLAYBOX_KV.put with key, value, and options', async () => {
      const value = 'test-value';
      const options = { expirationTtl: 3600 };

      await adapter.put('test-key', value, options);

      expect(mockEnv.PLAYBOX_KV.put).toHaveBeenCalledWith('test-key', value, options);
    });

    it('should call PLAYBOX_KV.put with key and value only when options not provided', async () => {
      await adapter.put('test-key', 'test-value');

      expect(mockEnv.PLAYBOX_KV.put).toHaveBeenCalledWith('test-key', 'test-value', undefined);
    });
  });

  describe('delete', () => {
    it('should call PLAYBOX_KV.delete with the provided key', async () => {
      await adapter.delete('test-key');

      expect(mockEnv.PLAYBOX_KV.delete).toHaveBeenCalledWith('test-key');
    });
  });
});
