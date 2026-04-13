import { ProtocolType, ProviderConfig } from './provider';

/**
 * Tool Definition (OpenAI Format)
 */
export interface StandardTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters?: any; // JSON Schema
  };
}

/**
 * Tool Call (OpenAI Format)
 */
	export interface StandardToolCall {
	id: string;
	type: 'function';
	function: {
	name: string;
	arguments: string;
	};
	}

	export type ToolChoice = 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };

	export interface StandardMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: StandardToolCall[]; // For assistant messages
  tool_call_id?: string; // For tool responses
  name?: string; // For tool responses
}

export interface ProtocolAdapter {
  name: string;

  // Path and Auth Conversion
  getAttempt(): number;
  getApiKey(env: Env, provider: ProviderConfig, ctx: ExecutionContext): Promise<string>;
  getEndpoint(provider: ProviderConfig, model: string, isStream: boolean, apiKey?: string): Promise<string>;
  getHeaders(provider: ProviderConfig, env: Env, ctx: ExecutionContext, apiKey?: string): Promise<Record<string, string>>;

  // Request Conversion (External <-> Standard)
  toStandardRequest(body: any): any;
  fromStandardRequest(stdBody: any): any;

  // Response Conversion (Non-stream)
  toStandardResponse(body: any, model: string): any;
  fromStandardResponse(stdBody: any): any;

  // Stream Conversion (Returns TransformStream)
  createToStandardStream(model: string): TransformStream;
  createFromStandardStream(): TransformStream;
}