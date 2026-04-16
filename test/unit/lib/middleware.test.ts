import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAuthentication, withCorsPreflight, withErrorHandling } from '../../../src/lib/middleware';
import { createMockEnv, createMockExecutionContext, createTestHeaders } from '../../factories';

describe('Middleware', () => {
  describe('withAuthentication', () => {
    it('should allow request with valid x-api-key header', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const headers = createTestHeaders('sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();
      const context = { env, executionCtx: createMockExecutionContext() };

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should allow request with valid Authorization Bearer header', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const headers = new Headers();
      headers.set('Authorization', 'Bearer sk-test-token');
      headers.set('Content-Type', 'application/json');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();
      const context = { env, executionCtx: createMockExecutionContext() };

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const headers = createTestHeaders('invalid-key');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();
      const context = { env, executionCtx: createMockExecutionContext() };

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
      const body = await response.json();
      expect((body as any).error.message).toBe('Incorrect API key provided.');
    });

    it('should reject request without API key', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const request = new Request('http://localhost/test', {
        headers: { 'Content-Type': 'application/json' },
      });
      const env = createMockEnv();
      const context = { env, executionCtx: createMockExecutionContext() };

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should include CORS headers in unauthorized response', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const request = new Request('http://localhost/test', {
        headers: { 'Content-Type': 'application/json' },
      });
      const env = createMockEnv();
      const context = { env, executionCtx: createMockExecutionContext() };

      const response = await wrappedHandler(request, context);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should pass cloudflare context to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withAuthentication(mockHandler);

      const headers = createTestHeaders('sk-test-token');
      const request = new Request('http://localhost/test', { headers });
      const env = createMockEnv();
      const executionCtx = createMockExecutionContext();
      const context = { env, executionCtx };

      await wrappedHandler(request, context);

      expect(mockHandler).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          env,
          executionCtx,
          cloudflare: expect.objectContaining({
            env,
            executionCtx,
          }),
        })
      );
    });
  });

  describe('withCorsPreflight', () => {
    it('should return 204 for OPTIONS request', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withCorsPreflight(mockHandler);

      const request = new Request('http://localhost/test', { method: 'OPTIONS' });

      const response = await wrappedHandler(request);

      expect(response.status).toBe(204);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should include CORS headers for OPTIONS request', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withCorsPreflight(mockHandler);

      const request = new Request('http://localhost/test', { method: 'OPTIONS' });

      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('should call handler for non-OPTIONS request', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withCorsPreflight(mockHandler);

      const request = new Request('http://localhost/test', { method: 'GET' });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(response.status).toBe(200);
    });

    it('should pass through POST requests', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('created', { status: 201 }));
      const wrappedHandler = withCorsPreflight(mockHandler);

      const request = new Request('http://localhost/test', { method: 'POST' });

      const response = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });
  });

  describe('withErrorHandling', () => {
    it('should return response from successful handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success', { status: 200 }));
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = {};

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request, context);
    });

    it('should catch error and return 500 response', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = {};

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect((body as any).error.message).toBe('Internal Server Error');
      expect((body as any).error.type).toBe('internal_error');
    });

    it('should include Content-Type header in error response', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = {};

      const response = await wrappedHandler(request, context);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should log error to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const mockHandler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = {};

      await wrappedHandler(request, context);

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', error);
      consoleSpy.mockRestore();
    });

    it('should handle async errors', async () => {
      const mockHandler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      });
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = {};

      const response = await wrappedHandler(request, context);

      expect(response.status).toBe(500);
    });

    it('should pass context to handler', async () => {
      const mockHandler = vi.fn().mockResolvedValue(new Response('success'));
      const wrappedHandler = withErrorHandling(mockHandler);

      const request = new Request('http://localhost/test');
      const context = { testProp: 'test-value' };

      await wrappedHandler(request, context);

      expect(mockHandler).toHaveBeenCalledWith(request, context);
    });
  });
});
