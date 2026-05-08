import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareR2Adapter } from '../../../../src/storage/cloudflare/r2';
import type { MockEnv } from '../../../../test/factories';

describe('CloudflareR2Adapter', () => {
  let mockEnv: MockEnv;
  let adapter: CloudflareR2Adapter;

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
      PLAYBOX_R2: {
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      GEMINI_CLI_CLIENT_ID: 'test-client-id',
      GEMINI_CLI_CLIENT_SECRET: 'test-client-secret',
      GEMINI_CLI_REFRESH_TOKEN: 'test-refresh-token',
      API_CONFIG: undefined,
      fetch: vi.fn(),
    } as unknown as MockEnv;

    adapter = new CloudflareR2Adapter(mockEnv);
  });

  describe('put', () => {
    it('should call PLAYBOX_R2.put with key, body, and options', async () => {
      const body = new ArrayBuffer(8);
      const options = { httpMetadata: { contentType: 'application/json' } };

      await adapter.put('test-key', body, options);

      expect(mockEnv.PLAYBOX_R2.put).toHaveBeenCalledWith('test-key', body, options);
    });

    it('should call PLAYBOX_R2.put without options when not provided', async () => {
      const body = 'test-content';

      await adapter.put('test-key', body);

      expect(mockEnv.PLAYBOX_R2.put).toHaveBeenCalledWith('test-key', body, undefined);
    });
  });

  describe('get', () => {
    it('should call PLAYBOX_R2.get with the provided key', async () => {
      const mockObject = { body: 'test-content', key: 'test-key' };
      mockEnv.PLAYBOX_R2.get.mockResolvedValueOnce(mockObject);

      const result = await adapter.get('test-key');

      expect(mockEnv.PLAYBOX_R2.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(mockObject);
    });

    it('should return null when object does not exist', async () => {
      mockEnv.PLAYBOX_R2.get.mockResolvedValueOnce(null);

      const result = await adapter.get('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should call PLAYBOX_R2.delete with the provided key', async () => {
      await adapter.delete('test-key');

      expect(mockEnv.PLAYBOX_R2.delete).toHaveBeenCalledWith('test-key');
    });
  });

  describe('list', () => {
    it('should call PLAYBOX_R2.list with prefix option', async () => {
      const mockObjects = ['key1', 'key2', 'prefix/key3'];
      mockEnv.PLAYBOX_R2.list.mockResolvedValueOnce({ objects: mockObjects.map((key) => ({ key })) });

      const result = await adapter.list('prefix/');

      expect(mockEnv.PLAYBOX_R2.list).toHaveBeenCalledWith({ prefix: 'prefix/' });
      expect(result).toEqual(mockObjects);
    });

    it('should return all keys when no prefix provided', async () => {
      const mockObjects = [{ key: 'key1' }, { key: 'key2' }];
      mockEnv.PLAYBOX_R2.list.mockResolvedValueOnce({ objects: mockObjects });

      const result = await adapter.list();

      expect(mockEnv.PLAYBOX_R2.list).toHaveBeenCalledWith({});
      expect(result).toEqual(['key1', 'key2']);
    });
  });
});
