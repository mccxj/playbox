import type { KVStorage } from '../interface';

type StoredValue = {
  value: any;
  expiry?: number;
};

export class VercelKVAdapter implements KVStorage {
  private store = new Map<string, StoredValue>();

  async get(key: string, options?: { type?: string }): Promise<any> {
    const stored = this.store.get(key);
    if (!stored) return undefined;

    if (this.isExpired(stored)) {
      this.store.delete(key);
      return undefined;
    }

    // If type is 'json', parse the stored JSON string
    if (options?.type === 'json' && typeof stored.value === 'string') {
      try {
        return JSON.parse(stored.value);
      } catch {
        return stored.value;
      }
    }

    return stored.value;
  }

  private isExpired(stored: StoredValue): boolean {
    return stored.expiry !== undefined && Date.now() > stored.expiry;
  }

  async put(key: string, value: any, options?: Record<string, any>): Promise<void> {
    // Match Cloudflare KV behavior: store objects as JSON strings, keep strings as-is
    let valueToStore: string;
    if (typeof value === 'string') {
      valueToStore = value;
    } else {
      valueToStore = JSON.stringify(value);
    }
    
    const stored: StoredValue = { value: valueToStore };
    if (options?.expiry !== undefined) {
      stored.expiry = options.expiry;
    }
    this.store.set(key, stored);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
