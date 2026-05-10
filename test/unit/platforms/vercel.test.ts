/**
 * Unit tests for Vercel platform context
 * Tests D1 REST API integration for Vercel deployment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPlatformType,
  getPlatformDb,
  getPlatformEnv,
  isPlatform,
  resetPlatformContext,
  setPlatformContext,
} from '../../../src/platforms';
import type { PlatformContext } from '../../../src/platforms/types';
import type { SqlClient } from '../../../src/db/types';

describe('Vercel Platform Context', () => {
  beforeEach(() => {
    // Reset singleton before each test
    resetPlatformContext();
  });

  afterEach(() => {
    resetPlatformContext();
  });

  describe('Vercel context detection', () => {
    it('should use Vercel platform when set via setPlatformContext', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: undefined,
        }),
      };

      setPlatformContext(vercelContext);

      expect(getPlatformType()).toBe('vercel');
      expect(isPlatform('vercel')).toBe(true);
    });

    it('should not be cloudflare when set to vercel', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
        }),
      };

      setPlatformContext(vercelContext);

      expect(isPlatform('vercel')).toBe(true);
      expect(isPlatform('cloudflare')).toBe(false);
      expect(isPlatform('nodejs')).toBe(false);
    });
  });

  describe('D1 REST API configuration', () => {
    it('should return D1 client when Cloudflare env vars are configured', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [], success: true, meta: {} }),
          }),
        }),
      } as unknown as SqlClient;

      const vercelContext: PlatformContext = {
        getDatabase: () => mockDb,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: mockDb,
          authToken: undefined,
        }),
      };

      setPlatformContext(vercelContext);

      const db = getPlatformDb();
      expect(db).not.toBeNull();
      expect(db).toBe(mockDb);
    });

    it('should return null database when Cloudflare credentials are missing', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: undefined,
        }),
      };

      setPlatformContext(vercelContext);

      const db = getPlatformDb();
      expect(db).toBeNull();
    });
  });

  describe('Fallback behavior when env vars missing', () => {
    it('should return null for getPlatformDb when configuration incomplete', () => {
      const noDbContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: undefined,
        }),
      };

      setPlatformContext(noDbContext);

      const db = getPlatformDb();
      expect(db).toBeNull();
    });

    it('should have vercel platform type when database is unavailable', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
        }),
      };

      setPlatformContext(vercelContext);

      expect(getPlatformType()).toBe('vercel');
    });
  });

  describe('Auth token handling', () => {
    it('should include authToken in platform environment', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: 'test-token-123',
        }),
      };

      setPlatformContext(vercelContext);

      const env = getPlatformEnv();
      expect(env.authToken).toBe('test-token-123');
      expect(env.platformType).toBe('vercel');
    });

    it('should have undefined authToken when not configured', () => {
      const vercelContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: undefined,
        }),
      };

      setPlatformContext(vercelContext);

      const env = getPlatformEnv();
      expect(env.authToken).toBeUndefined();
    });
  });

  describe('Database connection', () => {
    it('should return the mock database when set', () => {
      const mockDb = {
        prepare: vi.fn(),
      } as unknown as SqlClient;

      const vercelContext: PlatformContext = {
        getDatabase: () => mockDb,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: mockDb,
        }),
      };

      setPlatformContext(vercelContext);

      const db = getPlatformDb();
      expect(db).toBe(mockDb);
    });

    it('should call getDatabase when getting platform db', () => {
      const mockDb = {
        prepare: vi.fn(),
      } as unknown as SqlClient;

      const vercelContext: PlatformContext = {
        getDatabase: () => mockDb,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: mockDb,
        }),
      };

      setPlatformContext(vercelContext);

      const db = getPlatformDb();
      expect(db).toBe(mockDb);
    });
  });
});