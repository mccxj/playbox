export function createCloudflareContext(executionCtx: ExecutionContext, env: any) {
  return {
    get env() {
      return env;
    },

    get executionCtx() {
      return executionCtx;
    },

    getBinding<T>(name: string): T | undefined {
      return env[name] as T | undefined;
    }
  };
}

export interface CloudflareContext {
  env: Record<string, any>;
  executionCtx: any;
}