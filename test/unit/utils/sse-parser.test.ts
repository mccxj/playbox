import { describe, it, expect, beforeEach } from 'vitest';
import { createSSEParser } from '../../../src/utils/sse-parser';
import type { SSEEvent } from '../../../src/utils/sse-parser';

describe('SSE Parser', () => {
  let events: SSEEvent[];
  let parser: ReturnType<typeof createSSEParser>;

  beforeEach(() => {
    events = [];
    parser = createSSEParser((event: SSEEvent) => {
      events.push(event);
    });
  });

  describe('basic parsing', () => {
    it('should parse single data line', () => {
      const chunk = new TextEncoder().encode('data: {"message": "hello"}\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('{"message": "hello"}');
    });

    it('should parse event and data lines', () => {
      const chunk = new TextEncoder().encode('event: message\ndata: hello\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('message');
      expect(events[0].data).toBe('hello');
    });

    it('should parse multiple events in single chunk', () => {
      const chunk = new TextEncoder().encode('data: first\n\ndata: second\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(2);
      expect(events[0].data).toBe('first');
      expect(events[1].data).toBe('second');
    });

    it('should handle empty lines', () => {
      const chunk = new TextEncoder().encode('data: test\n\n\n\ndata: test2\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(2);
    });
  });

  describe('chunk boundaries', () => {
    it('should handle partial data line across chunks', () => {
      const chunk1 = new TextEncoder().encode('data: hel');
      const chunk2 = new TextEncoder().encode('lo\n\n');

      parser.process(chunk1);
      expect(events).toHaveLength(0);

      parser.process(chunk2);
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('hello');
    });

    it('should handle partial event line across chunks', () => {
      const chunk1 = new TextEncoder().encode('event: mes');
      const chunk2 = new TextEncoder().encode('sage\ndata: test\n\n');

      parser.process(chunk1);
      expect(events).toHaveLength(0);

      parser.process(chunk2);
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('message');
    });

    it('should handle split across multiple chunks', () => {
      const chunk1 = new TextEncoder().encode('data: ');
      const chunk2 = new TextEncoder().encode('part');
      const chunk3 = new TextEncoder().encode('1');
      const chunk4 = new TextEncoder().encode('\n\n');

      parser.process(chunk1);
      parser.process(chunk2);
      parser.process(chunk3);
      expect(events).toHaveLength(0);

      parser.process(chunk4);
      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('part1');
    });

    it('should handle partial newline', () => {
      const chunk1 = new TextEncoder().encode('data: test\n');
      const chunk2 = new TextEncoder().encode('\n');

      parser.process(chunk1);
      expect(events).toHaveLength(1);

      parser.process(chunk2);
      expect(events).toHaveLength(1);
    });
  });

  describe('data formats', () => {
    it('should parse JSON data', () => {
      const chunk = new TextEncoder().encode('data: {"key": "value", "number": 42}\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('{"key": "value", "number": 42}');
    });

    it('should parse plain text data', () => {
      const chunk = new TextEncoder().encode('data: plain text message\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('plain text message');
    });

    it('should handle empty data', () => {
      const chunk = new TextEncoder().encode('data: \n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('');
    });

    it('should handle data with spaces after colon', () => {
      const chunk = new TextEncoder().encode('data:   spaced data  \n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('spaced data');
    });
  });

  describe('event types', () => {
    it('should reset event name after data', () => {
      const chunk = new TextEncoder().encode('event: type1\ndata: msg1\n\nevent: type2\ndata: msg2\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('type1');
      expect(events[1].event).toBe('type2');
    });

    it('should handle unnamed events', () => {
      const chunk = new TextEncoder().encode('data: msg1\n\ndata: msg2\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('');
      expect(events[1].event).toBe('');
    });

    it('should preserve event name for next data', () => {
      const chunk = new TextEncoder().encode('event: custom\ndata: first\n\ndata: second\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('custom');
      expect(events[1].event).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle Windows-style line endings', () => {
      const chunk = new TextEncoder().encode('data: test\r\n\r\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
    });

    it('should skip empty data lines', () => {
      const chunk = new TextEncoder().encode('\n\ndata: test\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('test');
    });

    it('should handle comment lines (starting with :)', () => {
      const chunk = new TextEncoder().encode(': this is a comment\ndata: test\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('test');
    });

    it('should handle UTF-8 data', () => {
      const chunk = new TextEncoder().encode('data: 你好世界 🌍\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe('你好世界 🌍');
    });

    it('should handle large data payloads', () => {
      const largeData = 'x'.repeat(10000);
      const chunk = new TextEncoder().encode(`data: ${largeData}\n\n`);
      parser.process(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toBe(largeData);
    });
  });

  describe('SSE field types', () => {
    it('should ignore id field', () => {
      const chunk = new TextEncoder().encode('id: 123\ndata: test\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
    });

    it('should ignore retry field', () => {
      const chunk = new TextEncoder().encode('retry: 1000\ndata: test\n\n');
      parser.process(chunk);

      expect(events).toHaveLength(1);
    });
  });
});
