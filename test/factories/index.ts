import { vi } from "vitest";

export function createMockMessage(overrides?: any): any {
  return {
    role: 'user',
    content: 'Test message content',
    ...overrides
  };
}

export function createMockChatRequest(overrides?: any): any {
  return {
    model: 'test-model',
    messages: [createMockMessage()],
    stream: false,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.95,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    ...overrides
  };
}

export function createMockProviderConfig(overrides?: any): any {
  return {
    type: 'openai',
    endpoint: 'https://api.test.com',
    key: 'test-provider-key',
    models: ['test-model-1', 'test-model-2'],
    ...overrides
  };
}

export function createMockEnv(customEnv?: any): any {
	return {
		AUTH_TOKEN: 'sk-test-token',
		PLAYBOX_KV: {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn()
		},
		PLAYBOX_D1: {
			prepare: vi.fn(),
			batch: vi.fn()
		},
		PLAYBOX_R2: {
			get: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
			list: vi.fn()
		},
		GEMINI_CLI_CLIENT_ID: 'test-client-id',
		GEMINI_CLI_CLIENT_SECRET: 'test-client-secret',
		GEMINI_CLI_REFRESH_TOKEN: 'test-refresh-token',
		API_CONFIG: undefined,
		fetch: vi.fn(),
		...customEnv
	};
}

export function createMockExecutionContext(): any {
  const ctx: any = {};
  ctx.waitUntil = vi.fn();
  ctx.passThroughOnException = vi.fn();
  return ctx;
}

export function createTestHeaders(token: string = 'sk-test-token'): Headers {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  headers.set('x-api-key', token);
  return headers;
}

export function createMockRequest(path: string = '/test', options?: any): Request {
  return new Request(`http://localhost${path}`, {
    method: 'GET',
    headers: createTestHeaders(),
    ...options
  });
}