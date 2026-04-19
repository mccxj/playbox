import { describe, it, expect } from 'vitest';
import { CORS_HEADERS } from '../../../src/utils/constants';

describe('Constants', () => {
  describe('CORS_HEADERS', () => {
    it('should have Access-Control-Allow-Origin set to *', () => {
      expect(CORS_HEADERS['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should have Access-Control-Allow-Methods defined', () => {
      expect(CORS_HEADERS['Access-Control-Allow-Methods']).toBeDefined();
      expect(typeof CORS_HEADERS['Access-Control-Allow-Methods']).toBe('string');
    });

    it('should have Access-Control-Allow-Headers defined', () => {
      expect(CORS_HEADERS['Access-Control-Allow-Headers']).toBeDefined();
      expect(typeof CORS_HEADERS['Access-Control-Allow-Headers']).toBe('string');
    });

    it('should include common HTTP methods in Allow-Methods', () => {
      const methods = CORS_HEADERS['Access-Control-Allow-Methods'];
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('OPTIONS');
    });

    it('should include Content-Type in Allow-Headers', () => {
      const headers = CORS_HEADERS['Access-Control-Allow-Headers'];
      expect(headers).toContain('Content-Type');
    });

    it('should include Authorization in Allow-Headers', () => {
      const headers = CORS_HEADERS['Access-Control-Allow-Headers'];
      expect(headers).toContain('Authorization');
    });

    it('should include x-goog-api-key in Allow-Headers', () => {
      const headers = CORS_HEADERS['Access-Control-Allow-Headers'];
      expect(headers).toContain('x-goog-api-key');
    });

    it('should include x-api-key in Allow-Headers', () => {
      const headers = CORS_HEADERS['Access-Control-Allow-Headers'];
      expect(headers).toContain('x-api-key');
    });

    it('should be an object', () => {
      expect(typeof CORS_HEADERS).toBe('object');
      expect(CORS_HEADERS).not.toBeNull();
    });

    it('should have exactly 4 headers', () => {
      const keys = Object.keys(CORS_HEADERS);
      expect(keys.length).toBe(4);
    });

    it('should include HEAD in Allow-Methods', () => {
      const methods = CORS_HEADERS['Access-Control-Allow-Methods'];
      expect(methods).toContain('HEAD');
    });

    it('should include Range in Allow-Headers', () => {
      const headers = CORS_HEADERS['Access-Control-Allow-Headers'];
      expect(headers).toContain('Range');
    });

    it('should have Access-Control-Expose-Headers defined', () => {
      expect(CORS_HEADERS['Access-Control-Expose-Headers']).toBeDefined();
      expect(typeof CORS_HEADERS['Access-Control-Expose-Headers']).toBe('string');
    });

    it('should expose range-related headers in Expose-Headers', () => {
      const exposeHeaders = CORS_HEADERS['Access-Control-Expose-Headers'];
      expect(exposeHeaders).toContain('Content-Length');
      expect(exposeHeaders).toContain('Content-Range');
      expect(exposeHeaders).toContain('Accept-Ranges');
    });

    it('should be assignable to Record type', () => {
      const headers: Record<string, string> = CORS_HEADERS;
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });
});
