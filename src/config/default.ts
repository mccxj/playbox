import { Provider, ProviderConfig } from '../types/provider';
import providersJson from './providers.json';
import type { Env } from '../types';

export interface Config {
  providers: Provider;
  default_provider: string;
}

export const STATIC_CONFIG: Config = {
  providers: providersJson.providers as Provider,
  default_provider: providersJson.default_provider,
};

async function loadProvidersFromD1(env: Env): Promise<Config | null> {
  const db = env.PLAYBOX_D1;
  if (!db) return null;

  try {
    const { results } = await db
      .prepare('SELECT name, type, family, endpoint, key, models, auth_type FROM providers WHERE enabled = 1 ORDER BY sort_order ASC')
      .all();

    if (!results || results.length === 0) {
      return null;
    }

    const providers: Provider = {};
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
      } catch {
        continue;
      }
    }

    return {
      providers,
      default_provider: STATIC_CONFIG.default_provider,
    };
  } catch {
    return null;
  }
}

export async function getDefaultConfig(env: Env): Promise<Config> {
  const fromD1 = await loadProvidersFromD1(env);
  if (fromD1) return fromD1;

  return STATIC_CONFIG;
}
