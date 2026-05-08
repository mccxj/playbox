import type { R2Storage } from '../interface';

type R2Bucket = any;
type R2Object = { key: string };

export class CloudflareR2Adapter implements R2Storage {
  private r2: any;

  constructor(env: { PLAYBOX_R2: any }) {
    this.r2 = env.PLAYBOX_R2;
  }

  async put(key: string, body: any, options?: Record<string, any>): Promise<void> {
    await this.r2.put(key, body, options);
  }

  async get(key: string): Promise<any> {
    return this.r2.get(key);
  }

  async delete(key: string): Promise<void> {
    await this.r2.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const result = await this.r2.list(prefix ? { prefix } : {});
    return result.objects.map((obj: R2Object) => obj.key);
  }
}
