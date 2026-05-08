import type { KVStorage, D1Storage, R2Storage } from './interface';
import { CloudflareKVAdapter, CloudflareD1Adapter, CloudflareR2Adapter } from './cloudflare';
import { VercelKVAdapter, VercelD1Adapter, VercelR2Adapter } from './vercel';

export interface StorageAdapters {
  kv: KVStorage;
  d1: D1Storage;
  r2: R2Storage;
}

export function createStorageAdapters(env: any): StorageAdapters {
  // Detect platform based on available bindings
  if (env.PLAYBOX_KV && env.PLAYBOX_D1 && env.PLAYBOX_R2) {
    // Cloudflare Workers environment
    return {
      kv: new CloudflareKVAdapter(env),
      d1: new CloudflareD1Adapter(env),
      r2: new CloudflareR2Adapter(env),
    };
  } else {
    // Vercel environment (or other platforms) - use mock implementations
    return {
      kv: new VercelKVAdapter(),
      d1: new VercelD1Adapter(),
      r2: new VercelR2Adapter(),
    };
  }
}
