import type { Env } from '../types';

export function createCloudflareContext(executionCtx: ExecutionContext, env: Env) {
  return {
    get env() {
      return env;
    },

    get executionCtx() {
      return executionCtx;
    },

    getBinding<T>(name: string): T | undefined {
      return (env as unknown as Record<string, unknown>)[name] as T | undefined;
    },
  };
}

export interface CloudflareContext {
  env: Cloudflare.Env;
  executionCtx: ExecutionContext;
}
