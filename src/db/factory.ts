/**
 * Factory function to create SqlClient based on runtime environment
 */

import type { D1Database } from '@cloudflare/workers-types';
import { D1Adapter, d1Adapter } from './d1-adapter';
import type { SqlClient } from './types';

export interface SqlClientOptions {
  d1?: D1Database;
  // Future: turso options
  // turso?: { url: string; token: string };
  // supabase?: { url: string; anonKey: string };
}

/**
 * Create a SqlClient based on available environment bindings
 *
 * Currently supports D1 (Cloudflare).预留 Turso/Supabase.
 */
export function createSqlClient(options: SqlClientOptions): SqlClient {
  if (options.d1) {
    return new D1Adapter(options.d1);
  }

  // Future: Turso support
  // if (options.turso) {
  //   return new TursoAdapter(options.turso);
  // }

  // Future: Supabase support
  // if (options.supabase) {
  //   return new SupabaseAdapter(options.supabase);
  // }

  throw new Error('No database binding provided. Expected D1 or other database client.');
}

// Re-export d1Adapter for convenience
export { d1Adapter };