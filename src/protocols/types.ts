import type { Env } from '../types';

export type { Env };

export interface Provider {
  key: string;
  type: string;
  baseUrl?: string;
  endpoint: string;
  supportsStreaming?: boolean;
  models: string[];
  authType?: 'header' | 'bearer';
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Protocol Adapter Interface
 *
 * Core methods (required): getApiKey, getEndpoint, getHeaders, getAttempt
 * Conversion methods (optional): Only needed for protocol-to-protocol conversion (e.g., Anthropic ↔ OpenAI)
 *
 * Most adapters are pass-through and don't need conversion methods.
 * Anthropic adapter is the only one with real conversion logic.
 */
export interface ProtocolAdapter {
  name: string;
  getAttempt(): number;
  getApiKey(env: Env, provider: Provider, ctx: ExecutionContext): Promise<string>;
  getEndpoint(provider: Provider, model: string, isStream: boolean, apiKey: string): Promise<string>;
  getHeaders(provider: Provider, env: Env, ctx: ExecutionContext, apiKey: string): Promise<Record<string, string>>;

  // Optional: Request/response conversion (only for protocol-to-protocol conversion)
  toStandardRequest?(body: any): any;
  fromStandardRequest?(stdBody: any): any;
  toStandardResponse?(body: any, model: string): any;
  fromStandardResponse?(stdBody: any): any;
  createToStandardStream?(model: string): TransformStream;
  createFromStandardStream?(): TransformStream;
}
