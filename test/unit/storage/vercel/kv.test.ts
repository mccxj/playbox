import { describe, it, expect, beforeEach } from 'vitest';
import { VercelKVAdapter } from '../../../../src/storage/vercel/kv';
import type { KVStorage } from '../../../../src/storage/interface';

describe('VercelKVAdapter', () => {
  let adapter: KVStorage;

  beforeEach(() => {
    adapter = new VercelKVAdapter();
  });

  describe('get', () => {
    it('returns undefined for non-existent key', async () => {
      const result = await adapter.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('returns value for existing key', async () => {
      await adapter.put('test-key', 'test-value');
      const result = await adapter.get('test-key');
      expect(result).toBe('test-value');
    });

    it('returns undefined for expired key', async () => {
      await adapter.put('expiring-key', 'expiring-value', { expiry: Date.now() + 1 });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result = await adapter.get('expiring-key');
      expect(result).toBeUndefined();
    });
  });

  describe('put', () => {
    it('stores string values', async () => {
      await adapter.put('str-key', 'hello');
      expect(await adapter.get('str-key')).toBe('hello');
    });

    it('stores object values', async () => {
      const obj = { foo: 'bar', num: 123 };
      await adapter.put('obj-key', obj);
      expect(await adapter.get('obj-key', { type: 'json' })).toEqual(obj);
    });

    it('overwrites existing keys', async () => {
      await adapter.put('overwrite-key', 'old');
      await adapter.put('overwrite-key', 'new');
      expect(await adapter.get('overwrite-key')).toBe('new');
    });

    it('supports expiry option', async () => {
      const expiry = Date.now() + 1000;
      await adapter.put('expiry-key', 'value', { expiry });
      expect(await adapter.get('expiry-key')).toBe('value');
    });
  });

  describe('delete', () => {
    it('removes existing key', async () => {
      await adapter.put('delete-key', 'to-delete');
      await adapter.delete('delete-key');
      expect(await adapter.get('delete-key')).toBeUndefined();
    });

    it('does not throw for non-existent key', async () => {
      await expect(adapter.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('interface compliance', () => {
    it('implements KVStorage interface', () => {
      expect(typeof adapter.get).toBe('function');
      expect(typeof adapter.put).toBe('function');
      expect(typeof adapter.delete).toBe('function');
    });
  });
});
