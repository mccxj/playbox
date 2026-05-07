import { describe, it, expect } from 'vitest';
import { getConfig, resolveProvider, ConfigManager } from '../../../src/config/index';
import { STATIC_CONFIG } from '../../../src/config/default';
import { ProtocolFamily } from '../../../src/types/provider';

describe('Config', () => {
  describe('getConfig', () => {
    it('should return STATIC_CONFIG when API_CONFIG is not set and D1 is unavailable', async () => {
      const env = {};

      const config = await getConfig(env);

      expect(config).toEqual(STATIC_CONFIG);
    });

    it('should return STATIC_CONFIG when API_CONFIG is undefined', async () => {
      const env = { API_CONFIG: undefined };

      const config = await getConfig(env);

      expect(config).toEqual(STATIC_CONFIG);
    });
  });

  describe('resolveProvider', () => {
    it('should resolve provider by model name', () => {
      const config = STATIC_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat');

      expect(result.name).toBe('longcat');
      expect(result.provider.type).toBe('openai');
    });

    it('should fallback to first matching provider when family not found', () => {
      const config = STATIC_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat', 'nonexistent' as ProtocolFamily);

      expect(result.name).toBe('longcat');
    });

    it('should return default_provider when model not found', () => {
      const config = STATIC_CONFIG;

      const result = resolveProvider(config, 'nonexistent-model');

      expect(result.name).toBe(config.default_provider);
    });

    it('should handle empty providers object', () => {
      const config = {
        providers: {},
        default_provider: 'default',
      };

      const result = resolveProvider(config, 'any-model');

      expect(result.name).toBe('default');
      expect(result.provider).toBeUndefined();
    });
  });

  describe('ConfigManager', () => {
    it('should expose getConfig function', () => {
      expect(ConfigManager.getConfig).toBe(getConfig);
    });

    it('should expose resolveProvider function', () => {
      expect(ConfigManager.resolveProvider).toBe(resolveProvider);
    });

    it('should work through ConfigManager.getConfig', async () => {
      const env = {};

      const config = await ConfigManager.getConfig(env);

      expect(config).toEqual(STATIC_CONFIG);
    });

    it('should work through ConfigManager.resolveProvider', () => {
      const config = STATIC_CONFIG;

      const result = ConfigManager.resolveProvider(config, 'LongCat-Flash-Chat');

      expect(result.name).toBe('longcat');
    });
  });
});
