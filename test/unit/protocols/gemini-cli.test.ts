import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGeminiCliProtocol } from '../../../src/protocols/gemini-cli';
import { createMockEnv, createMockExecutionContext, createMockProviderConfig } from '../../factories';

describe('Gemini CLI Protocol Adapter', () => {
  let protocol: ReturnType<typeof createGeminiCliProtocol>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let mockCtx: ReturnType<typeof createMockExecutionContext>;
  let mockProvider: ReturnType<typeof createMockProviderConfig>;

  beforeEach(() => {
    protocol = createGeminiCliProtocol();
    mockEnv = createMockEnv();
    mockCtx = createMockExecutionContext();
    mockProvider = createMockProviderConfig({
      type: 'gemini-cli',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash',
      key: 'gemini-cli-provider-key',
      models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    });
  });

  it('should create protocol instance', () => {
    expect(protocol).toBeDefined();
    expect(protocol.name).toBe('gemini-cli');
  });

  it('should have required core methods', () => {
    expect(typeof protocol.getAttempt).toBe('function');
    expect(typeof protocol.getApiKey).toBe('function');
    expect(typeof protocol.getEndpoint).toBe('function');
    expect(typeof protocol.getHeaders).toBe('function');
  });

  it('should NOT have conversion methods (pass-through adapter)', () => {
    expect(protocol.toStandardRequest).toBeUndefined();
    expect(protocol.fromStandardRequest).toBeUndefined();
    expect(protocol.toStandardResponse).toBeUndefined();
    expect(protocol.fromStandardResponse).toBeUndefined();
    expect(protocol.createToStandardStream).toBeUndefined();
    expect(protocol.createFromStandardStream).toBeUndefined();
  });

  describe('getAttempt', () => {
    it('should return 1 (no retries for OAuth)', () => {
      expect(protocol.getAttempt()).toBe(1);
    });
  });

  describe('getApiKey', () => {
    it('should call KeyManager.getValidAccessToken for OAuth token', async () => {
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue({
        accessToken: 'cached-token',
        expiresAt: Date.now() + 3600000,
      });
      mockEnv.PLAYBOX_D1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{
              content: JSON.stringify({
                client_id: 'test-client-id',
                client_secret: 'test-client-secret',
                refresh_token: 'test-refresh-token'
              })
            }]
          })
        })
      } as any;

      const apiKey = await protocol.getApiKey(mockEnv, mockProvider, mockCtx);
      expect(typeof apiKey).toBe('string');
    });
  });

  describe('getEndpoint', () => {
    it('should return correct endpoint for non-streaming requests', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'gemini-1.5-flash', false, 'test-token');
      expect(endpoint).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
    });

    it('should return correct endpoint for streaming requests', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'gemini-1.5-flash', true, 'test-token');
      expect(endpoint).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse');
    });

    it('should use provider endpoint as base', async () => {
      const customProvider = createMockProviderConfig({
        type: 'gemini-cli',
        endpoint: 'https://custom.endpoint.com/v1beta/models/custom-model',
      });
      const endpoint = await protocol.getEndpoint(customProvider, 'custom-model', false, 'test-token');
      expect(endpoint).toContain('custom.endpoint.com');
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers with Bearer token', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'test-access-token');
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-access-token',
        'User-Agent': 'google-api-nodejs-client/10.5.0',
        'x-goog-api-client': 'gl-node/24.14.0',
      });
    });

    it('should use provided token in Authorization header', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'different-token');
      expect(headers['Authorization']).toBe('Bearer different-token');
    });

    it('should include required Google API headers', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'test-token');
      expect(headers['User-Agent']).toBe('google-api-nodejs-client/10.5.0');
      expect(headers['x-goog-api-client']).toBe('gl-node/24.14.0');
    });
  });
});
