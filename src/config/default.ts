import { Provider, ProviderConfig } from '../types/provider';
import type { Env } from '../types';
import { createStorageAdapters, StorageAdapters } from '../storage/factory';
import type { D1Storage } from '../storage/interface';

export interface Config {
  providers: Provider;
  default_provider: string;
}

async function loadProvidersFromD1(d1: D1Storage): Promise<Config | null> {
  try {
    const { results } = await d1.query(
      'SELECT name, type, family, endpoint, key, models, auth_type FROM providers WHERE enabled = 1 ORDER BY sort_order ASC',
      []
    );

    if (!results || results.length === 0) {
      return null;
    }

    const providers: Provider = {};
    let defaultProvider = '';

    for (const row of results as unknown as Record<string, unknown>[]) {
      const name = row.name as string;
      try {
        const models: string[] = JSON.parse(row.models as string);
        providers[name] = {
          type: row.type as ProviderConfig['type'],
          family: row.family as ProviderConfig['family'],
          endpoint: row.endpoint as string,
          key: row.key as string,
          models,
          ...(row.auth_type ? { authType: row.auth_type as ProviderConfig['authType'] } : {}),
        };

        if (!defaultProvider) {
          defaultProvider = name;
        }
      } catch {
        continue;
      }
    }

    return {
      providers,
      default_provider: defaultProvider,
    };
  } catch {
    return null;
  }
}

const CONFIG_CACHE_KEY = 'config:default';
const CONFIG_CACHE_TTL = 3600;

export async function getDefaultConfig(env: Env): Promise<Config> {
  const adapters = createStorageAdapters(env);

  try {
    const cached = await adapters.kv.get(CONFIG_CACHE_KEY, { type: 'json' }) as Config | null;
    if (cached) {
      return cached;
    }
  } catch {
    // Cache read failed, fall through to D1
  }

  const config = await loadProvidersFromD1(adapters.d1);
  if (!config) {
    throw new Error('No provider configuration found. Please configure providers in D1 database.');
  }

  try {
    await adapters.kv.put(CONFIG_CACHE_KEY, JSON.stringify(config), { expirationTtl: CONFIG_CACHE_TTL });
  } catch {
    // Cache write failed, but we still have the config
  }

  return config;
}
