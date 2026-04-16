import { describe, it, expect } from 'vitest';
import { authenticate, createUnauthorizedResponse } from '../../../src/lib/auth';
import { createMockEnv, createTestHeaders } from '../../factories';

describe('Auth', () => {
  describe('authenticate', () => {
    it('should return true for valid x-api-key header', () => {
      const headers = createTestHeaders('sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should return true for valid x-goog-api-key header', () => {
      const headers = new Headers();
      headers.set('x-goog-api-key', 'sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should return true for valid Authorization Bearer header', () => {
      const headers = new Headers();
      headers.set('Authorization', 'Bearer sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should return false for invalid API key', () => {
      const headers = createTestHeaders('invalid-key');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should return false for missing API key', () => {
      const request = new Request('http://localhost/test');
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(false);
    });

    it('should use default key when AUTH_TOKEN is not set', () => {
      const headers = new Headers();
      headers.set('x-api-key', 'sk-1234');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv({ AUTH_TOKEN: undefined });

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should prioritize x-goog-api-key over other headers', () => {
      const headers = new Headers();
      headers.set('x-goog-api-key', 'sk-test-token');
      headers.set('x-api-key', 'wrong-key');
      headers.set('Authorization', 'Bearer wrong-key');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should handle Bearer token without space', () => {
      const headers = new Headers();
      headers.set('Authorization', 'Bearer sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });

    it('should return true when Authorization header has the token directly (replaces "Bearer " from value)', () => {
      const headers = new Headers();
      headers.set('Authorization', 'sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();

      const result = authenticate(request, env);

      expect(result).toBe(true);
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('should return 401 response', () => {
      const response = createUnauthorizedResponse();

      expect(response.status).toBe(401);
    });

    it('should return JSON content type', () => {
      const response = createUnauthorizedResponse();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createUnauthorizedResponse();

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });

    it('should have correct error structure', async () => {
      const response = createUnauthorizedResponse();
      const body = await response.json();

      expect((body as any).error.message).toBe('Incorrect API key provided.');
      expect((body as any).error.type).toBe('invalid_request_error');
    });
  });
});
