import { ProtocolAdapter, Env, Provider, ExecutionContext } from './types';
import { KeyManager } from '../managers/key';
import { createSSEParser, SSEParser, SSEEvent } from '../utils/sse-parser';

export function createAnthropicProtocol(): ProtocolAdapter {
  return {
    name: 'anthropic',
    getAttempt: () => 3,
    getApiKey: async (env: Env, provider: Provider, ctx: ExecutionContext): Promise<string> =>
      KeyManager.getRandomApiKey(env, provider, ctx),
    getEndpoint: async (provider: Provider, model: string, isStream: boolean, apiKey: string): Promise<string> => {
      const baseUrl = provider.endpoint ?? 'https://api.anthropic.com';
      return `${baseUrl}/v1/messages`;
    },
    getHeaders: async (provider: Provider, env: Env, ctx: ExecutionContext, apiKey: string): Promise<Record<string, string>> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      };
      if (provider.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['x-api-key'] = apiKey;
      }
      return headers;
    },

    toStandardRequest: (body: any): any => {
      const messages = [];
      if (body.system) {
        const sys = typeof body.system === 'string' ? body.system : body.system.map((b: any) => b.text).join('\n');
        if (sys) messages.push({ role: 'system', content: sys });
      }
      for (const msg of body.messages || []) {
        const content = Array.isArray(msg.content) ? msg.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('\n') : msg.content;
        messages.push({ role: msg.role, content });
      }
      return {
        model: body.model,
        messages,
        max_tokens: body.max_tokens || 4096,
        temperature: body.temperature,
        top_p: body.top_p,
        stop_sequences: body.stop,
        stream: body.stream,
      };
    },
    fromStandardRequest: (stdBody: any): any => {
      let system = '';
      const messages = [];
      for (const msg of stdBody.messages || []) {
        if (msg.role === 'system') system += msg.content + '\n';
        else messages.push({ role: msg.role, content: msg.content });
      }
      return {
        model: stdBody.model,
        system: system ? system.trim() : undefined,
        messages,
        max_tokens: stdBody.max_tokens || 4096,
        temperature: stdBody.temperature,
        top_p: stdBody.top_p,
        stream: stdBody.stream,
      };
    },
    toStandardResponse: (body: any, model: string): any => {
      const finishReason = body.stop_reason === 'max_tokens' ? 'length' : 'stop';
      return {
        id: body.id || `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: body.content?.map((c: any) => c.text).join('') || '' },
            finish_reason: finishReason,
          },
        ],
        usage: {
          prompt_tokens: body.usage?.input_tokens || 0,
          completion_tokens: body.usage?.output_tokens || 0,
          total_tokens: (body.usage?.input_tokens || 0) + (body.usage?.output_tokens || 0),
        },
      };
    },
    fromStandardResponse: (stdBody: any): any => {
      const choice = stdBody.choices?.[0] || {};
      const stopReason = choice.finish_reason === 'length' ? 'max_tokens' : 'end_turn';
      return {
        id: stdBody.id || `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        model: stdBody.model,
        content: [{ type: 'text', text: choice.message?.content || '' }],
        stop_reason: stopReason,
        stop_sequence: null,
        usage: { input_tokens: stdBody.usage?.prompt_tokens || 0, output_tokens: stdBody.usage?.completion_tokens || 0 },
      };
    },
    createToStandardStream: (model: string): TransformStream => {
      const streamId = 'chatcmpl-' + Date.now();
      const encoder = new TextEncoder();
      let parser: SSEParser | undefined;

      return new TransformStream({
        start(controller) {
          parser = createSSEParser(({ event, data }: SSEEvent) => {
            if (!data) return;
            try {
              const json = JSON.parse(data);
              if (event === 'content_block_delta' && json.delta?.text) {
                const chunk = {
                  id: streamId,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model,
                  choices: [{ index: 0, delta: { content: json.delta.text }, finish_reason: null }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              } else if (event === 'message_delta' && json.delta?.stop_reason) {
                const finishReason = json.delta.stop_reason === 'max_tokens' ? 'length' : 'stop';
                const chunk = {
                  id: streamId,
                  object: 'chat.completion.chunk',
                  created: Math.floor(Date.now() / 1000),
                  model,
                  choices: [{ index: 0, delta: {}, finish_reason: finishReason }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch (e) {}
          });
        },
        transform(chunk: Uint8Array, controller: TransformStreamDefaultController<any>) {
          if (parser) parser.process(chunk);
        },
        flush(controller) {
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        },
      });
    },
    createFromStandardStream: (): TransformStream => {
      const encoder = new TextEncoder();
      let started = false;
      let parser: SSEParser | undefined;
      const writeEvent = (controller: TransformStreamDefaultController<any>, event: string, data: any) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      return new TransformStream({
        start(controller) {
          parser = createSSEParser(({ data }) => {
            if (data === '[DONE]') {
              writeEvent(controller, 'content_block_stop', { type: 'content_block_stop', index: 0 });
              writeEvent(controller, 'message_delta', {
                type: 'message_delta',
                delta: { stop_reason: 'end_turn' },
                usage: { output_tokens: 0 },
              });
              writeEvent(controller, 'message_stop', { type: 'message_stop' });
              return;
            }
            try {
              const json = JSON.parse(data);
              const choice = json.choices?.[0];
              if (!started && choice) {
                writeEvent(controller, 'message_start', {
                  type: 'message_start',
                  message: {
                    id: json.id || `msg_${Date.now()}`,
                    type: 'message',
                    role: 'assistant',
                    model: json.model || '',
                    content: [],
                    stop_reason: null,
                    stop_sequence: null,
                    usage: { input_tokens: 0, output_tokens: 0 },
                  },
                });
                writeEvent(controller, 'content_block_start', {
                  type: 'content_block_start',
                  index: 0,
                  content_block: { type: 'text', text: '' },
                });
                started = true;
              }
              if (choice?.delta?.content) {
                writeEvent(controller, 'content_block_delta', {
                  type: 'content_block_delta',
                  index: 0,
                  delta: { type: 'text_delta', text: choice.delta.content },
                });
              }
            } catch (e) {}
          });
        },
        transform(chunk: Uint8Array, controller: TransformStreamDefaultController<any>) {
          if (parser) parser.process(chunk);
        },
      });
    },
  };
}
