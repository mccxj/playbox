/**
 * Response Types for AI API Gateway
 */

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage?: Usage;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface MessageResponse {
  role: 'assistant';
  content: string;
  model: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}
