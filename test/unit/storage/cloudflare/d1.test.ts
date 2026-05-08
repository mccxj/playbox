import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareD1Adapter } from '../../../../src/storage/cloudflare/d1';
import type { MockEnv } from '../../../../test/factories';

describe('CloudflareD1Adapter', () => {
  let mockEnv: MockEnv;
  let adapter: CloudflareD1Adapter;
  let mockStmt: any;

  beforeEach(() => {
    mockStmt = {
      bind: vi.fn().mockReturnThis(),
      all: vi.fn(),
      run: vi.fn(),
    };

    mockEnv = {
      AUTH_TOKEN: 'test-token',
      PLAYBOX_KV: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      },
      PLAYBOX_D1: {
        prepare: vi.fn().mockReturnValue(mockStmt),
        batch: vi.fn(),
      },
      GEMINI_CLI_CLIENT_ID: 'test-client-id',
      GEMINI_CLI_CLIENT_SECRET: 'test-client-secret',
      GEMINI_CLI_REFRESH_TOKEN: 'test-refresh-token',
      API_CONFIG: undefined,
      fetch: vi.fn(),
    } as unknown as MockEnv;

    adapter = new CloudflareD1Adapter(mockEnv);
  });

  describe('query', () => {
    it('should prepare statement, bind params, and return results', async () => {
      const mockResults = { results: [{ id: 1, name: 'test' }] };
      mockStmt.all.mockResolvedValueOnce(mockResults);

      const result = await adapter.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(mockEnv.PLAYBOX_D1.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?');
      expect(mockStmt.bind).toHaveBeenCalledWith(1);
      expect(mockStmt.all).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it('should work without params', async () => {
      const mockResults = { results: [{ id: 1 }] };
      mockStmt.all.mockResolvedValueOnce(mockResults);

      const result = await adapter.query('SELECT * FROM users');

      expect(mockStmt.bind).not.toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });
  });

  describe('execute', () => {
    it('should prepare statement, bind params, and run', async () => {
      mockStmt.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.execute('INSERT INTO users (name) VALUES (?)', ['test']);

      expect(mockEnv.PLAYBOX_D1.prepare).toHaveBeenCalledWith('INSERT INTO users (name) VALUES (?)');
      expect(mockStmt.bind).toHaveBeenCalledWith('test');
      expect(mockStmt.run).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should work without params', async () => {
      mockStmt.run.mockResolvedValueOnce({ success: true });

      const result = await adapter.execute('DELETE FROM users');

      expect(mockStmt.bind).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });
});
