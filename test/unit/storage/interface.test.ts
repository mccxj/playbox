import { describe, it, expect } from 'vitest';
import { KVStorage, D1Storage, R2Storage } from '../../../src/storage/interface';

describe('Storage Interfaces', () => {
  describe('KVStorage', () => {
    it('should have get method', () => {
      const mock: KVStorage = {
        get: (key: string) => Promise.resolve(null),
        put: (key: string, value: any, options?: any) => Promise.resolve(),
        delete: (key: string) => Promise.resolve(),
      };
      expect(typeof mock.get).toBe('function');
    });

    it('should have put method', () => {
      const mock: KVStorage = {
        get: (key: string) => Promise.resolve(null),
        put: (key: string, value: any, options?: any) => Promise.resolve(),
        delete: (key: string) => Promise.resolve(),
      };
      expect(typeof mock.put).toBe('function');
    });

    it('should have delete method', () => {
      const mock: KVStorage = {
        get: (key: string) => Promise.resolve(null),
        put: (key: string, value: any, options?: any) => Promise.resolve(),
        delete: (key: string) => Promise.resolve(),
      };
      expect(typeof mock.delete).toBe('function');
    });
  });

  describe('D1Storage', () => {
    it('should have query method', () => {
      const mock: D1Storage = {
        query: (sql: string, params?: any[]) => Promise.resolve({ results: [] }),
        execute: (sql: string, params?: any[]) => Promise.resolve({ success: true }),
      };
      expect(typeof mock.query).toBe('function');
    });

    it('should have execute method', () => {
      const mock: D1Storage = {
        query: (sql: string, params?: any[]) => Promise.resolve({ results: [] }),
        execute: (sql: string, params?: any[]) => Promise.resolve({ success: true }),
      };
      expect(typeof mock.execute).toBe('function');
    });
  });

  describe('R2Storage', () => {
    it('should have put method', () => {
      const mock: R2Storage = {
        put: (key: string, body: any, options?: any) => Promise.resolve(),
        get: (key: string) => Promise.resolve(null),
        delete: (key: string) => Promise.resolve(),
        list: (prefix?: string) => Promise.resolve([]),
      };
      expect(typeof mock.put).toBe('function');
    });

    it('should have get method', () => {
      const mock: R2Storage = {
        put: (key: string, body: any, options?: any) => Promise.resolve(),
        get: (key: string) => Promise.resolve(null),
        delete: (key: string) => Promise.resolve(),
        list: (prefix?: string) => Promise.resolve([]),
      };
      expect(typeof mock.get).toBe('function');
    });

    it('should have delete method', () => {
      const mock: R2Storage = {
        put: (key: string, body: any, options?: any) => Promise.resolve(),
        get: (key: string) => Promise.resolve(null),
        delete: (key: string) => Promise.resolve(),
        list: (prefix?: string) => Promise.resolve([]),
      };
      expect(typeof mock.delete).toBe('function');
    });

    it('should have list method', () => {
      const mock: R2Storage = {
        put: (key: string, body: any, options?: any) => Promise.resolve(),
        get: (key: string) => Promise.resolve(null),
        delete: (key: string) => Promise.resolve(),
        list: (prefix?: string) => Promise.resolve([]),
      };
      expect(typeof mock.list).toBe('function');
    });
  });
});
