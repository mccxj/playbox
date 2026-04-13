import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGoogleProtocol } from '../../../src/protocols/google';
import { createMockEnv, createMockExecutionContext, createMockProviderConfig } from '../../factories';

describe('Google Protocol Adapter', () => {
  let protocol: ReturnType<typeof createGoogleProtocol>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let mockCtx: ReturnType<typeof createMockExecutionContext>;
  let mockProvider: ReturnType<typeof createMockProviderConfig>;

  beforeEach(() => {
    protocol = createGoogleProtocol();
    mockEnv = createMockEnv();
    mockCtx = createMockExecutionContext();
    mockProvider = createMockProviderConfig({
      type: 'google',
      endpoint: 'https://generativelanguage.googleapis.com',
      key: 'google-provider-key',
      models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    });
  });

  it('should create protocol instance', () => {
    expect(protocol).toBeDefined();
    expect(protocol.name).toBe('google');
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
    it('should return default attempt count', () => {
      expect(protocol.getAttempt()).toBe(3);
    });
  });

  describe('getApiKey', () => {
    it('should call KeyManager.getRandomApiKey', async () => {
      const mockD1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({
            results: [{ content: 'test-api-key-1' }, { content: 'test-api-key-2' }],
          }),
        }),
      };
      mockEnv.PLAYBOX_D1 = mockD1 as any;

      const apiKey = await protocol.getApiKey(mockEnv, mockProvider, mockCtx);
      expect(typeof apiKey).toBe('string');
      expect(apiKey).toMatch(/^test-api-key-/);
    });
  });

  describe('getEndpoint', () => {
    it('should return correct endpoint for non-streaming requests', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'gemini-1.5-flash', false, 'test-api-key');
      expect(endpoint).toContain('generativelanguage.googleapis.com');
      expect(endpoint).toContain('/v1beta/models/gemini-1.5-flash:generateContent');
      expect(endpoint).toContain('key=test-api-key');
      expect(endpoint).not.toContain('alt=sse');
    });

    it('should return correct endpoint for streaming requests', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'gemini-1.5-pro', true, 'test-api-key');
      expect(endpoint).toContain('generativelanguage.googleapis.com');
      expect(endpoint).toContain('/v1beta/models/gemini-1.5-pro:streamGenerateContent');
      expect(endpoint).toContain('key=test-api-key');
      expect(endpoint).toContain('alt=sse');
    });

    it('should include API key in query parameter', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'gemini-1.5-flash', false, 'my-secret-key');
      expect(endpoint).toContain('key=my-secret-key');
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers with API key', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'test-api-key');
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'x-goog-api-key': 'test-api-key',
      });
    });

    it('should use provided API key in headers', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'different-key');
      expect(headers['x-goog-api-key']).toBe('different-key');
    });
  });
});
