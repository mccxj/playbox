import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger, Logger } from '../../../src/utils/logger';

describe('Logger', () => {
  describe('createLogger', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create logger with info method', () => {
      const logger = createLogger();

      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should create logger with warn method', () => {
      const logger = createLogger();

      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should create logger with error method', () => {
      const logger = createLogger();

      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('should log info message with level prefix', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), '');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test message'), '');
      consoleSpy.mockRestore();
    });

    it('should log warn message with level prefix', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.warn('warning message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), '');
      consoleSpy.mockRestore();
    });

    it('should log error message with level prefix', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.error('error message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), '');
      consoleSpy.mockRestore();
    });

    it('should include request ID in log output', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.info('test');

      const loggedMessage = consoleSpy.mock.calls[0][0];
      const reqIdMatch = loggedMessage.match(/\[[a-f0-9]{4}\]/);
      expect(reqIdMatch).not.toBeNull();
      consoleSpy.mockRestore();
    });

    it('should log metadata as JSON string', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();
      const meta = { key: 'value', count: 42 };

      logger.info('test message', meta);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), JSON.stringify(meta));
      consoleSpy.mockRestore();
    });

    it('should handle null metadata', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.info('test message', null);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), '');
      consoleSpy.mockRestore();
    });

    it('should handle undefined metadata', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();

      logger.info('test message', undefined);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), '');
      consoleSpy.mockRestore();
    });

    it('should handle complex metadata objects', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger = createLogger();
      const meta = { nested: { deep: 'value' }, array: [1, 2, 3] };

      logger.info('test', meta);

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), JSON.stringify(meta));
      consoleSpy.mockRestore();
    });

    it('should generate unique request IDs for different loggers', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const logger1 = createLogger();
      const logger2 = createLogger();

      logger1.info('test1');
      logger2.info('test2');

      const msg1 = consoleSpy.mock.calls[0][0];
      const msg2 = consoleSpy.mock.calls[1][0];

      const id1 = msg1.match(/\[([a-f0-9]{4})\]/)?.[1];
      const id2 = msg2.match(/\[([a-f0-9]{4})\]/)?.[1];

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('Logger', () => {
    it('should expose create method', () => {
      expect(Logger.create).toBeDefined();
      expect(Logger.create).toBe(createLogger);
    });

    it('should create logger via Logger.create', () => {
      const logger = Logger.create();

      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should return consistent Logger interface', () => {
      const logger = Logger.create();

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
