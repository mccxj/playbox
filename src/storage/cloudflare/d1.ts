import type { D1Storage } from '../interface';

type D1Database = any;

export class CloudflareD1Adapter implements D1Storage {
  private d1: any;

  constructor(env: { PLAYBOX_D1: any }) {
    this.d1 = env.PLAYBOX_D1;
  }

  async query(sql: string, params?: any[]): Promise<{ results: any[] }> {
    const stmt = this.d1.prepare(sql);
    if (params) {
      stmt.bind(...params);
    }
    return stmt.all();
  }

  async execute(sql: string, params?: any[]): Promise<{ success: boolean }> {
    const stmt = this.d1.prepare(sql);
    if (params) {
      stmt.bind(...params);
    }
    return stmt.run();
  }
}
