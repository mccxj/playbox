import { vi } from 'vitest';

export interface MockMessage {
  role: string;
  content: string;
}

export interface MockChatRequest {
  model: string;
  messages: MockMessage[];
  stream: boolean;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export interface MockProviderConfig {
  type: string;
  endpoint: string;
  key: string;
  models: string[];
}

export interface MockEnv {
  AUTH_TOKEN: string;
  PLAYBOX_KV: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  PLAYBOX_D1: {
    prepare: ReturnType<typeof vi.fn>;
    batch: ReturnType<typeof vi.fn>;
  };
  GEMINI_CLI_CLIENT_ID: string;
  GEMINI_CLI_CLIENT_SECRET: string;
  GEMINI_CLI_REFRESH_TOKEN: string;
  API_CONFIG: unknown;
  fetch: ReturnType<typeof vi.fn>;
}

export function createMockMessage(overrides?: Partial<MockMessage>): MockMessage {
  return {
    role: 'user',
    content: 'Test message content',
    ...overrides,
  };
}

export function createMockChatRequest(overrides?: Partial<MockChatRequest>): MockChatRequest {
  return {
    model: 'test-model',
    messages: [createMockMessage()],
    stream: false,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.95,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    ...overrides,
  };
}

export function createMockProviderConfig(overrides?: Partial<MockProviderConfig>): MockProviderConfig {
  return {
    type: 'openai',
    endpoint: 'https://api.test.com',
    key: 'test-provider-key',
    models: ['test-model-1', 'test-model-2'],
    ...overrides,
  };
}

export function createMockEnv(customEnv?: Partial<MockEnv>): MockEnv {
  return {
    AUTH_TOKEN: 'sk-test-token',
    PLAYBOX_KV: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
    },
    PLAYBOX_D1: {
      prepare: vi.fn(),
      batch: vi.fn(),
    },
    GEMINI_CLI_CLIENT_ID: 'test-client-id',
    GEMINI_CLI_CLIENT_SECRET: 'test-client-secret',
    GEMINI_CLI_REFRESH_TOKEN: 'test-refresh-token',
    API_CONFIG: undefined,
    fetch: vi.fn(),
    ...customEnv,
  };
}

export interface MockExecutionContext {
  waitUntil: ReturnType<typeof vi.fn>;
  passThroughOnException: ReturnType<typeof vi.fn>;
}

export function createMockExecutionContext(): MockExecutionContext {
  return {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  };
}

export function createTestHeaders(token = 'sk-test-token'): Headers {
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  headers.set('x-api-key', token);
  return headers;
}

export function createMockRequest(path = '/test', options?: Record<string, unknown>): Request {
  return new Request(`http://localhost${path}`, {
    method: 'GET',
    headers: createTestHeaders(),
    ...options,
  });
}
