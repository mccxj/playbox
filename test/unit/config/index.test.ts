import { describe, it, expect } from 'vitest';
import { getConfig, resolveProvider, resolveModelAlias, ConfigManager } from '../../../src/config/index';
import { DEFAULT_CONFIG } from '../../../src/config/default';
import { ProtocolFamily } from '../../../src/types/provider';

describe('Config', () => {
  describe('getConfig', () => {
    it('should return DEFAULT_CONFIG when API_CONFIG is not set', () => {
      const env = {};

      const config = getConfig(env);

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should return DEFAULT_CONFIG when API_CONFIG is undefined', () => {
      const env = { API_CONFIG: undefined };

      const config = getConfig(env);

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should parse API_CONFIG when set', () => {
      const customConfig = {
        providers: {
          test_provider: {
            type: 'openai',
            family: 'openai' as const,
            endpoint: 'https://test.api',
            key: 'Test',
            models: ['test-model'],
          },
        },
        default_provider: 'test_provider',
      };
      const env = { API_CONFIG: JSON.stringify(customConfig) };

      const config = getConfig(env);

      expect(config.providers).toHaveProperty('test_provider');
      expect(config.default_provider).toBe('test_provider');
    });

    it('should handle invalid JSON in API_CONFIG', () => {
      const env = { API_CONFIG: 'invalid json' };

      expect(() => getConfig(env)).toThrow();
    });
  });

  describe('resolveProvider', () => {
    it('should resolve provider by model name', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat');

      expect(result.name).toBe('longcat');
      expect(result.provider.type).toBe('openai');
    });

    it('should resolve provider with preferred family', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat', 'anthropic' as ProtocolFamily);

      expect(result.name).toBe('longcat_claude');
      expect(result.provider.family).toBe('anthropic');
    });

    it('should fallback to first matching provider when family not found', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat', 'nonexistent' as ProtocolFamily);

      expect(result.name).toBe('longcat');
    });

    it('should return default_provider when model not found', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'nonexistent-model');

      expect(result.name).toBe(config.default_provider);
    });

    it('should return first model match when no family specified', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'gemini-3-flash-preview');

      expect(result.name).toBe('gemini');
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

    it('should prioritize family match over fallback', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat', 'anthropic' as ProtocolFamily);

      expect(result.provider.family).toBe('anthropic');
      expect(result.name).toBe('longcat_claude');
    });
  });

  describe('resolveModelAlias', () => {
    it('should return original model when no alias found', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveModelAlias(config, 'nonexistent-model');

      expect(result).toBe('nonexistent-model');
    });

    it('should resolve alias to real model name', () => {
      const config = {
        providers: {
          test_provider: {
            type: 'openai' as const,
            family: 'openai' as const,
            endpoint: 'https://test.api',
            key: 'Test',
            models: ['real-model-name'],
            modelAliases: {
              'alias-name': 'real-model-name',
            },
          },
        },
        default_provider: 'test_provider',
      };

      const result = resolveModelAlias(config, 'alias-name');

      expect(result).toBe('real-model-name');
    });

    it('should use first matching provider alias', () => {
      const config = {
        providers: {
          provider1: {
            type: 'openai' as const,
            family: 'openai' as const,
            endpoint: 'https://test1.api',
            key: 'Test1',
            models: ['model-1'],
            modelAliases: {
              'shared-alias': 'model-1',
            },
          },
          provider2: {
            type: 'openai' as const,
            family: 'openai' as const,
            endpoint: 'https://test2.api',
            key: 'Test2',
            models: ['model-2'],
            modelAliases: {
              'shared-alias': 'model-2',
            },
          },
        },
        default_provider: 'provider1',
      };

      const result = resolveModelAlias(config, 'shared-alias');

      expect(result).toBe('model-1');
    });

    it('should handle providers without modelAliases', () => {
      const config = {
        providers: {
          provider1: {
            type: 'openai' as const,
            family: 'openai' as const,
            endpoint: 'https://test.api',
            key: 'Test',
            models: ['model-1'],
          },
        },
        default_provider: 'provider1',
      };

      const result = resolveModelAlias(config, 'any-model');

      expect(result).toBe('any-model');
    });
  });

  describe('resolveProvider with aliases', () => {
    it('should resolve alias and return realModel', () => {
      const config = {
        providers: {
          test_provider: {
            type: 'openai' as const,
            family: 'openai' as const,
            endpoint: 'https://test.api',
            key: 'Test',
            models: ['real-model-name'],
            modelAliases: {
              'alias-name': 'real-model-name',
            },
          },
        },
        default_provider: 'test_provider',
      };

      const result = resolveProvider(config, 'alias-name', 'openai' as ProtocolFamily);

      expect(result.name).toBe('test_provider');
      expect(result.realModel).toBe('real-model-name');
    });

    it('should return realModel matching the actual model name when no alias', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveProvider(config, 'LongCat-Flash-Chat');

      expect(result.realModel).toBe('LongCat-Flash-Chat');
    });

    it('should resolve alias from cerebras provider', () => {
      const config = DEFAULT_CONFIG;

      const result = resolveModelAlias(config, 'qwen3');

      expect(result).toBe('qwen-3-235b-a22b-instruct-2507');
    });
  });

  describe('ConfigManager', () => {
    it('should expose getConfig function', () => {
      expect(ConfigManager.getConfig).toBe(getConfig);
    });

    it('should expose resolveProvider function', () => {
      expect(ConfigManager.resolveProvider).toBe(resolveProvider);
    });

    it('should work through ConfigManager.getConfig', () => {
      const env = {};

      const config = ConfigManager.getConfig(env);

      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('should work through ConfigManager.resolveProvider', () => {
      const config = DEFAULT_CONFIG;

      const result = ConfigManager.resolveProvider(config, 'LongCat-Flash-Chat');

      expect(result.name).toBe('longcat');
    });
  });
});
