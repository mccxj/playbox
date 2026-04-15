export * from './protocol';
export type { ProviderConfig, ProtocolType } from './provider';
export * from './kv';
export * from './request';
export * from './response';
export * from './r2';

import { ProviderConfig } from './provider';

export type Env = Cloudflare.Env;

export interface Config {
  providers: Record<string, ProviderConfig>;
  default_provider: string;
}

export type ResolvedProvider = {
  name: string;
  provider: ProviderConfig;
};
