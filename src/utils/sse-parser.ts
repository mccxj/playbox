export interface SSEEvent {
  event: string;
  data: string;
}

export interface SSEParser {
  process: (chunk: Uint8Array) => void;
}

export function createSSEParser(onMessage: (event: SSEEvent) => void): SSEParser {
  let buffer = '';
  let currentEvent = '';

  return {
    process: (chunk: Uint8Array) => {
      buffer += new TextDecoder('utf-8').decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          onMessage({ event: currentEvent, data: line.slice(5).trim() });
          currentEvent = '';
        }
}
    }
  };
}