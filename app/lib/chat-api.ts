export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_content?: string;
  id?: string;
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<ChatMessage> & { reasoning_content?: string };
    finish_reason: string | null;
  }>;
}

export interface ApiError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

export async function fetchModels(apiKey: string): Promise<Model[]> {
  const response = await fetch('/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApiError;
    throw new Error(errorData.error?.message || `Failed to fetch models: ${response.status}`);
  }

  const data = await response.json() as { data: Model[] };
  return data.data || [];
}

export async function chatCompletion(
  apiKey: string,
  request: ChatCompletionRequest,
  onStream?: (chunk: StreamChunk) => void
): Promise<ChatCompletionResponse | void> {
  const response = await fetch('/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as ApiError;
    throw new Error(errorData.error?.message || `Failed to send message: ${response.status}`);
  }

	// Handle streaming response
	if (request.stream && response.body) {
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			buffer += chunk;

			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data:')) {
					const data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
					if (data === '[DONE]') continue;

					try {
						const parsed = JSON.parse(data) as StreamChunk;
						onStream?.(parsed);
					} catch (e) {
						console.warn('Failed to parse stream chunk:', data);
					}
				}
			}
		}

		return;
	}

  const responseData = await response.json();
  return responseData as ChatCompletionResponse;
}
