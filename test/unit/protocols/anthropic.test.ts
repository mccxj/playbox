import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnthropicProtocol } from '../../../src/protocols/anthropic';
import { createMockEnv, createMockExecutionContext, createMockProviderConfig } from '../../factories';

describe('Anthropic Protocol Adapter', () => {
  let protocol: ReturnType<typeof createAnthropicProtocol>;
  let mockEnv: any;
  let mockCtx: any;
  let mockProvider: any;

  beforeEach(() => {
    protocol = createAnthropicProtocol();
    mockEnv = createMockEnv();
    mockCtx = createMockExecutionContext();
    mockProvider = createMockProviderConfig({
      type: 'anthropic',
      endpoint: 'https://api.anthropic.com'
    });
  });

  it('should create protocol instance', () => {
    expect(protocol).toBeDefined();
    expect(protocol.name).toBe('anthropic');
  });

  describe('getAttempt', () => {
    it('should return default attempt count', () => {
      const attempts = protocol.getAttempt();
      expect(attempts).toBe(3);
    });
  });

  describe('toStandardRequest', () => {
    it('should convert Anthropic format to standard format', () => {
      const anthropicRequest = {
        model: 'claude-3-opus',
        system: 'You are a helpful assistant',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ],
        max_tokens: 100,
        temperature: 0.7
      };

      const standardRequest = protocol.toStandardRequest(anthropicRequest);
      expect(standardRequest.model).toBe('claude-3-opus');
      expect(standardRequest.messages).toBeDefined();
      expect(standardRequest.messages.length).toBe(3);
      expect(standardRequest.max_tokens).toBe(100);
      expect(standardRequest.temperature).toBe(0.7);
    });

    it('should handle system messages correctly', () => {
      const request = {
        model: 'claude-3',
        system: 'System prompt here',
        messages: [{ role: 'user', content: 'User message' }],
        max_tokens: 500
      };

      const standard = protocol.toStandardRequest(request);
      const systemMessage = standard.messages.find((m: any) => m.role === 'system');
      expect(systemMessage).toBeDefined();
      expect(systemMessage?.content).toBe('System prompt here');
    });

    it('should handle user messages with separate system message', () => {
      const request = {
        model: 'claude-3',
        system: 'System context',
        messages: [{ role: 'user', content: 'User question' }],
        max_tokens: 100
      };

      const standard = protocol.toStandardRequest(request);
      const systemMessage = standard.messages.find((m: any) => m.role === 'system');
      const userMessage = standard.messages.find((m: any) => m.role === 'user');
      
      expect(systemMessage).toBeDefined();
      expect(systemMessage?.content).toBe('System context');
      expect(userMessage).toBeDefined();
      expect(userMessage?.content).toBe('User question');
    });

    it('should handle assistant messages', () => {
      const request = {
        model: 'claude-3',
        messages: [{ role: 'assistant', content: 'Previous response' }],
        max_tokens: 100
      };

      const standard = protocol.toStandardRequest(request);
      const assistantMessage = standard.messages.find((m: any) => m.role === 'assistant');
      expect(assistantMessage).toBeDefined();
      expect(assistantMessage?.content).toBe('Previous response');
    });
  });

  describe('fromStandardRequest', () => {
    it('should convert standard format to Anthropic format', () => {
      const standardRequest = {
        model: 'claude-3-opus',
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'User message' }
        ],
        max_tokens: 100,
        temperature: 0.5
      };

      const anthropicRequest = protocol.fromStandardRequest(standardRequest);
      expect(anthropicRequest.model).toBe('claude-3-opus');
      expect(anthropicRequest.system).toBe('System prompt');
      expect(anthropicRequest.messages).toBeDefined();
      expect(anthropicRequest.messages.length).toBe(1);
      expect(anthropicRequest.messages[0].role).toBe('user');
    });

    it('should handle messages without system role', () => {
      const request = {
        model: 'claude-3',
        messages: [
          { role: 'user', content: 'User message' }
        ],
        max_tokens: 100
      };

      const anthropic = protocol.fromStandardRequest(request);
      expect(anthropic.system).toBeUndefined();
      expect(anthropic.messages[0].role).toBe('user');
    });
  });

  describe('toStandardResponse', () => {
    it('should convert Anthropic response to standard format', () => {
      const anthropicResponse = {
        id: 'msg_12345',
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: 'Hello! How can I help you today?'
        }],
        model: 'claude-3-opus',
        usage: {
          input_tokens: 15,
          output_tokens: 25
        }
      };

      const standardResponse = protocol.toStandardResponse(anthropicResponse, 'claude-3-opus');
      expect(standardResponse.id).toBeDefined();
      expect(standardResponse.object).toBe('chat.completion');
      expect(standardResponse.model).toBe('claude-3-opus');
      expect(standardResponse.choices).toBeDefined();
      expect(standardResponse.choices.length).toBe(1);
      expect(standardResponse.choices[0].message.role).toBe('assistant');
      expect(standardResponse.choices[0].message.content).toBe('Hello! How can I help you today?');
      expect(standardResponse.usage).toBeDefined();
    });

    it('should handle different finish reasons', () => {
      const testCases = [
        { finishReason: 'end_turn', expected: 'stop' },
        { finishReason: 'max_tokens', expected: 'length' },
        { finishReason: 'stop_sequence', expected: 'stop' }
      ];

      testCases.forEach(({ finishReason, expected }) => {
        const response = {
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Test response' }],
          model: 'claude-3',
          stop_reason: finishReason
        };

        const standard = protocol.toStandardResponse(response, 'claude-3');
        expect(standard.choices[0].finish_reason).toBe(expected);
      });
    });
  });

  describe('createToStandardStream', () => {
    it('should create TransformStream for Anthropic streaming', () => {
      const transformStream = protocol.createToStandardStream('claude-3');

      expect(transformStream).toBeDefined();
      expect(transformStream).toHaveProperty('readable');
      expect(transformStream).toHaveProperty('writable');
    });
  });

  describe('createFromStandardStream', () => {
    it('should create TransformStream for reverse streaming', () => {
      const transformStream = protocol.createFromStandardStream();

      expect(transformStream).toBeDefined();
      expect(transformStream).toHaveProperty('readable');
      expect(transformStream).toHaveProperty('writable');
    });
  });

  describe('getApiKey', () => {
    it('should return random API key via KeyManager', async () => {
      mockEnv.PLAYBOX_KV.get = vi.fn().mockResolvedValue(['test-key-1', 'test-key-2']);
      mockEnv.PLAYBOX_D1 = {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          all: vi.fn().mockResolvedValue({ results: [] }),
        }),
      } as any;

      const key = await protocol.getApiKey(mockEnv, mockProvider, mockCtx);
      expect(['test-key-1', 'test-key-2']).toContain(key);
    });
  });

  describe('getEndpoint', () => {
    it('should return correct endpoint', async () => {
      const endpoint = await protocol.getEndpoint(mockProvider, 'claude-3', false, 'test-key');
      expect(endpoint).toBe('https://api.anthropic.com/v1/messages');
    });

    it('should use default endpoint when not specified', async () => {
      const providerWithoutEndpoint = { ...mockProvider, endpoint: undefined };
      const endpoint = await protocol.getEndpoint(providerWithoutEndpoint, 'claude-3', false, 'test-key');
      expect(endpoint).toBe('https://api.anthropic.com/v1/messages');
    });
  });

  describe('getHeaders', () => {
    it('should return x-api-key header by default', async () => {
      const headers = await protocol.getHeaders(mockProvider, mockEnv, mockCtx, 'test-api-key');
      expect(headers['x-api-key']).toBe('test-api-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should return Authorization header for bearer authType', async () => {
      const providerWithBearer = { ...mockProvider, authType: 'bearer' };
      const headers = await protocol.getHeaders(providerWithBearer, mockEnv, mockCtx, 'test-api-key');
      expect(headers['Authorization']).toBe('Bearer test-api-key');
    });
  });

  describe('fromStandardResponse', () => {
    it('should convert standard response to Anthropic format', () => {
      const standardResponse = {
        id: 'chatcmpl-123',
        model: 'claude-3',
        choices: [
          {
            message: { role: 'assistant', content: 'Response text' },
            finish_reason: 'stop',
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      };

      const anthropicResponse = protocol.fromStandardResponse(standardResponse);
      expect(anthropicResponse.id).toBeDefined();
      expect(anthropicResponse.type).toBe('message');
      expect(anthropicResponse.role).toBe('assistant');
      expect(anthropicResponse.content[0].text).toBe('Response text');
      expect(anthropicResponse.stop_reason).toBe('end_turn');
    });

    it('should handle length finish_reason as max_tokens', () => {
      const standardResponse = {
        id: 'chatcmpl-123',
        model: 'claude-3',
        choices: [{ message: { content: 'Test' }, finish_reason: 'length' }],
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      };

      const anthropicResponse = protocol.fromStandardResponse(standardResponse);
      expect(anthropicResponse.stop_reason).toBe('max_tokens');
    });

    it('should handle empty choices', () => {
      const standardResponse = {
        id: 'chatcmpl-123',
        model: 'claude-3',
        choices: [],
        usage: {},
      };

      const anthropicResponse = protocol.fromStandardResponse(standardResponse);
      expect(anthropicResponse.content[0].text).toBe('');
      expect(anthropicResponse.stop_reason).toBe('end_turn');
    });
  });
});