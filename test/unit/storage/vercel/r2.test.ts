import { describe, it, expect, beforeEach } from 'vitest';
import { VercelR2Adapter } from '../../../../src/storage/vercel/r2';

describe('VercelR2Adapter', () => {
  let adapter: VercelR2Adapter;

  beforeEach(() => {
    adapter = new VercelR2Adapter();
  });

  describe('put', () => {
    it('should store object without options', async () => {
      await adapter.put('test-key', 'test-body');
      const result = await adapter.get('test-key');
      expect(result).toBe('test-body');
    });

    it('should store object with options', async () => {
      const options = { contentType: 'application/json' };
      await adapter.put('test-key', { data: 'test' }, options);
      const result = await adapter.get('test-key');
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('get', () => {
    it('should return stored object', async () => {
      await adapter.put('test-key', 'test-body');
      const result = await adapter.get('test-key');
      expect(result).toBe('test-body');
    });

    it('should return undefined for non-existent key', async () => {
      const result = await adapter.get('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete stored object', async () => {
      await adapter.put('test-key', 'test-body');
      await adapter.delete('test-key');
      const result = await adapter.get('test-key');
      expect(result).toBeUndefined();
    });

    it('should not throw when deleting non-existent key', async () => {
      await expect(adapter.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('list', () => {
    it('should list all keys without prefix', async () => {
      await adapter.put('file1.txt', 'content1');
      await adapter.put('file2.txt', 'content2');
      await adapter.put('dir/file3.txt', 'content3');

      const keys = await adapter.list();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('file1.txt');
      expect(keys).toContain('file2.txt');
      expect(keys).toContain('dir/file3.txt');
    });

    it('should list keys with prefix', async () => {
      await adapter.put('dir/file1.txt', 'content1');
      await adapter.put('dir/file2.txt', 'content2');
      await adapter.put('other/file3.txt', 'content3');

      const keys = await adapter.list('dir/');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('dir/file1.txt');
      expect(keys).toContain('dir/file2.txt');
      expect(keys).not.toContain('other/file3.txt');
    });

    it('should return empty array when no keys match prefix', async () => {
      const keys = await adapter.list('non-existent/');
      expect(keys).toEqual([]);
    });
  });
});
