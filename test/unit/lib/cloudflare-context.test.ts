import { describe, it, expect } from 'vitest';
import { createCloudflareContext, type CloudflareContext } from '../../../src/lib/cloudflare-context';
import { createMockEnv, createMockExecutionContext } from '../../factories';

describe('Cloudflare Context', () => {
  describe('createCloudflareContext', () => {
    it('should create context with env getter', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      expect(context.env).toBe(env);
    });

    it('should create context with executionCtx getter', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      expect(context.executionCtx).toBe(executionCtx);
    });

    it('should return binding when it exists', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      const kv = context.getBinding('PLAYBOX_KV');
      expect(kv).toBe(env.PLAYBOX_KV);
    });

    it('should return undefined for non-existent binding', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      const binding = context.getBinding('NON_EXISTENT');
      expect(binding).toBeUndefined();
    });

    it('should return typed binding', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      const kv = context.getBinding<{ get: Function; put: Function }>('PLAYBOX_KV');
      expect(kv).toBeDefined();
      expect(typeof kv!.get).toBe('function');
      expect(typeof kv!.put).toBe('function');
    });

    it('should have env property accessible multiple times', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      expect(context.env).toBe(env);
      expect(context.env).toBe(env);
    });

    it('should have executionCtx property accessible multiple times', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      expect(context.executionCtx).toBe(executionCtx);
      expect(context.executionCtx).toBe(executionCtx);
    });
  });

  describe('CloudflareContext interface', () => {
    it('should match expected interface', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context: CloudflareContext = createCloudflareContext(executionCtx, env);

      expect(context).toHaveProperty('env');
      expect(context).toHaveProperty('executionCtx');
    });

    it('should have env as Record type', () => {
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();

      const context = createCloudflareContext(executionCtx, env);

      expect(typeof context.env).toBe('object');
      expect(context.env).toHaveProperty('AUTH_TOKEN');
      expect(context.env).toHaveProperty('PLAYBOX_KV');
    });
  });
});
