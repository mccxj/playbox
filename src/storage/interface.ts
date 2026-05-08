export interface KVStorage {
  get(key: string, options?: { type?: string }): Promise<any>;
  put(key: string, value: any, options?: Record<string, any>): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface D1Storage {
  query(sql: string, params?: any[]): Promise<{ results: any[] }>;
  execute(sql: string, params?: any[]): Promise<{ success: boolean }>;
}

export interface R2Storage {
  put(key: string, body: any, options?: Record<string, any>): Promise<void>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}
