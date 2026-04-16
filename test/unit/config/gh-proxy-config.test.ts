import { describe, it, expect } from 'vitest';
import { getGhProxyConfig, type GhProxyConfig } from '../../../src/config/gh-proxy-config';

describe('GH Proxy Config', () => {
  describe('getGhProxyConfig', () => {
    it('should return default config when no env vars set', () => {
      const env = {};

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(false);
      expect(config.redirectMode).toBe('manual');
    });

    it('should enable jsdelivr when GH_PROXY_JSD_ENABLE is "1"', () => {
      const env = { GH_PROXY_JSD_ENABLE: '1' };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(true);
    });

    it('should enable jsdelivr when GH_PROXY_JSD_ENABLE is "true"', () => {
      const env = { GH_PROXY_JSD_ENABLE: 'true' };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(true);
    });

    it('should not enable jsdelivr for other values', () => {
      const env = { GH_PROXY_JSD_ENABLE: 'yes' };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(false);
    });

    it('should not enable jsdelivr for "0"', () => {
      const env = { GH_PROXY_JSD_ENABLE: '0' };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(false);
    });

    it('should not enable jsdelivr for "false"', () => {
      const env = { GH_PROXY_JSD_ENABLE: 'false' };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(false);
    });

    it('should handle undefined GH_PROXY_JSD_ENABLE', () => {
      const env = { GH_PROXY_JSD_ENABLE: undefined };

      const config = getGhProxyConfig(env);

      expect(config.jsdelivrEnabled).toBe(false);
    });

    it('should always return manual redirect mode', () => {
      const env = {};

      const config = getGhProxyConfig(env);

      expect(config.redirectMode).toBe('manual');
    });

    it('should return GhProxyConfig interface', () => {
      const env = {};

      const config: GhProxyConfig = getGhProxyConfig(env);

      expect(config).toHaveProperty('jsdelivrEnabled');
      expect(config).toHaveProperty('redirectMode');
      expect(typeof config.jsdelivrEnabled).toBe('boolean');
      expect(['manual', 'follow']).toContain(config.redirectMode);
    });
  });

  describe('GhProxyConfig interface', () => {
    it('should have correct types', () => {
      const config: GhProxyConfig = {
        jsdelivrEnabled: true,
        redirectMode: 'manual',
      };

      expect(typeof config.jsdelivrEnabled).toBe('boolean');
      expect(typeof config.redirectMode).toBe('string');
    });
  });
});
