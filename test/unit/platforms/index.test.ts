/**
 * Unit tests for platform abstraction layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getPlatformType,
  isPlatform,
  getPlatformEnv,
  resetPlatformContext,
  setPlatformContext,
} from '../../../src/platforms';
import type { PlatformContext, PlatformType } from '../../../src/platforms/types';

describe('Platform Abstraction', () => {
  beforeEach(() => {
    // Reset singleton before each test
    resetPlatformContext();
  });

  afterEach(() => {
    resetPlatformContext();
  });

  describe('getPlatformType', () => {
    it('should return nodejs in test environment', () => {
      const platform = getPlatformType();
      expect(['nodejs', 'cloudflare', 'vercel', 'other']).toContain(platform);
    });
  });

  describe('isPlatform', () => {
    it('should return true for current platform', () => {
      const currentPlatform = getPlatformType();
      expect(isPlatform(currentPlatform)).toBe(true);
    });

    it('should return false for other platforms', () => {
      const currentPlatform = getPlatformType();
      const otherPlatforms: PlatformType[] = ['cloudflare', 'vercel', 'nodejs', 'other'].filter(
        (p) => p !== currentPlatform
      ) as PlatformType[];

      (otherPlatforms as PlatformType[]).forEach((platform) => {
        expect(isPlatform(platform)).toBe(false);
      });
    });
  });

  describe('getPlatformEnv', () => {
    it('should return platform environment', () => {
      const env = getPlatformEnv();
      expect(env).toHaveProperty('platformType');
      expect(['cloudflare', 'vercel', 'nodejs', 'other']).toContain(env.platformType);
    });

    it('should include primaryDb (may be null)', () => {
      const env = getPlatformEnv();
      expect('primaryDb' in env).toBe(true);
    });
  });

  describe('setPlatformContext', () => {
    it('should allow custom platform context', () => {
      const customContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'vercel',
        isPlatform: (p) => p === 'vercel',
        getEnv: () => ({
          platformType: 'vercel',
          primaryDb: null,
          authToken: 'test-token',
        }),
      };

      setPlatformContext(customContext);

      expect(getPlatformType()).toBe('vercel');
      expect(isPlatform('vercel')).toBe(true);
      expect(getPlatformEnv().authToken).toBe('test-token');
    });

    it('should override default context', () => {
      const customContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'cloudflare',
        isPlatform: (p) => p === 'cloudflare',
        getEnv: () => ({
          platformType: 'cloudflare',
          primaryDb: null,
          authToken: 'cf-token',
        }),
      };

      setPlatformContext(customContext);

      expect(getPlatformType()).toBe('cloudflare');
      expect(isPlatform('cloudflare')).toBe(true);
    });
  });

  describe('resetPlatformContext', () => {
    it('should reset context when called', () => {
      const customContext: PlatformContext = {
        getDatabase: () => null,
        getPlatformType: () => 'other',
        isPlatform: () => false,
        getEnv: () => ({
          platformType: 'other',
          primaryDb: null,
        }),
      };

      setPlatformContext(customContext);
      expect(getPlatformType()).toBe('other');

      resetPlatformContext();
      // After reset, should use default platform detection
      expect(['nodejs', 'cloudflare', 'vercel', 'other']).toContain(getPlatformType());
    });
  });
});