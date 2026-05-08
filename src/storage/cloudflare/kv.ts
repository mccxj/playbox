import type { KVStorage } from '../interface';

export class CloudflareKVAdapter implements KVStorage {
  private kv: any;

  constructor(env: { PLAYBOX_KV: any }) {
    this.kv = env.PLAYBOX_KV;
  }

  async get(key: string, options?: { type?: string }): Promise<any> {
    if (options) {
      return this.kv.get(key, options);
    }
    return this.kv.get(key);
  }

  async put(key: string, value: any, options?: Record<string, any>): Promise<void> {
    await this.kv.put(key, value, options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
