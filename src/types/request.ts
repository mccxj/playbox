/**
 * Request Types for AI API Gateway
 */

import { ProtocolType, ProviderConfig } from './provider';

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MessageRequest {
  provider: string;
  model: string;
  message: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}