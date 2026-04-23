import { DEFAULT_CONFIG, Config } from './default';
import { ProtocolFamily, ProviderConfig } from '../types/provider';

export interface ResolvedProvider {
  name: string;
  provider: ProviderConfig;
  realModel: string;
}

export function getConfig(env: Cloudflare.Env): Config {
  return env.API_CONFIG ? JSON.parse(env.API_CONFIG) : DEFAULT_CONFIG;
}

export function resolveProvider(config: Config, model: string, family?: ProtocolFamily): ResolvedProvider {
  const realModel = model;
  let fallbackProviderName: string | null = null;

  for (const [name, p] of Object.entries(config.providers)) {
    if (p.models && p.models.includes(realModel)) {
      if (!fallbackProviderName) fallbackProviderName = name;
      if (family && p.family === family) {
        return { name, provider: p, realModel };
      }
    }
  }

  const finalName = fallbackProviderName || config.default_provider;
  return { name: finalName, provider: config.providers[finalName], realModel };
}

export const ConfigManager = {
  getConfig,
  resolveProvider,
};
