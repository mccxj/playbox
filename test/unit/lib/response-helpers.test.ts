import { describe, it, expect } from 'vitest';
import {
  createJsonResponse,
  createUnauthorizedResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
  createOptionsResponse,
} from '../../../src/lib/response-helpers';

describe('Response Helpers', () => {
  describe('createJsonResponse', () => {
    it('should create response with default status 200', async () => {
      const data = { message: 'success' };
      const response = createJsonResponse(data);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should create response with custom status', async () => {
      const data = { created: true };
      const response = createJsonResponse(data, 201);

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should include Content-Type header', () => {
      const response = createJsonResponse({});
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createJsonResponse({});
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });

    it('should handle arrays', async () => {
      const data = [1, 2, 3];
      const response = createJsonResponse(data);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should handle null', async () => {
      const response = createJsonResponse(null);

      const body = await response.json();
      expect(body).toBeNull();
    });

    it('should handle primitive values', async () => {
      const response = createJsonResponse('simple string');

      const body = await response.json();
      expect(body).toBe('simple string');
    });
  });

  describe('createUnauthorizedResponse', () => {
    it('should create 401 response with default message', async () => {
      const response = createUnauthorizedResponse();

      expect(response.status).toBe(401);
      const body = (await response.json()) as any;
      expect(body.error.message).toBe('Incorrect API key provided.');
      expect(body.error.type).toBe('invalid_request_error');
    });

    it('should create 401 response with custom message', async () => {
      const response = createUnauthorizedResponse('Custom unauthorized message');

      const body = (await response.json()) as any;
      expect(body.error.message).toBe('Custom unauthorized message');
    });

    it('should include Content-Type header', () => {
      const response = createUnauthorizedResponse();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createUnauthorizedResponse();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should have correct error structure', async () => {
      const response = createUnauthorizedResponse('Test message');
      const body = (await response.json()) as any;

      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('message');
      expect(body.error).toHaveProperty('type');
    });
  });

  describe('createNotFoundResponse', () => {
    it('should create 404 response with default message', async () => {
      const response = createNotFoundResponse();

      expect(response.status).toBe(404);
      const body = (await response.json()) as any;
      expect(body.error).toBe('Endpoint not found');
    });

    it('should create 404 response with custom message', async () => {
      const response = createNotFoundResponse('Resource not found');

      const body = (await response.json()) as any;
      expect(body.error).toBe('Resource not found');
    });

    it('should include Content-Type header', () => {
      const response = createNotFoundResponse();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createNotFoundResponse();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('createInternalErrorResponse', () => {
    it('should create 500 response with default message', async () => {
      const response = createInternalErrorResponse();

      expect(response.status).toBe(500);
      const body = (await response.json()) as any;
      expect(body.error.message).toBe('Internal Server Error');
      expect(body.error.type).toBe('internal_error');
    });

    it('should create 500 response with custom message', async () => {
      const response = createInternalErrorResponse('Database connection failed');

      const body = (await response.json()) as any;
      expect(body.error.message).toBe('Database connection failed');
    });

    it('should include Content-Type header', () => {
      const response = createInternalErrorResponse();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers', () => {
      const response = createInternalErrorResponse();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should have correct error structure', async () => {
      const response = createInternalErrorResponse('Test error');
      const body = (await response.json()) as any;

      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('message');
      expect(body.error).toHaveProperty('type');
      expect(body.error.type).toBe('internal_error');
    });
  });

  describe('createOptionsResponse', () => {
    it('should create 204 response', () => {
      const response = createOptionsResponse();
      expect(response.status).toBe(204);
    });

    it('should have empty body', async () => {
      const response = createOptionsResponse();
      const text = await response.text();
      expect(text).toBe('');
    });

    it('should include CORS headers', () => {
      const response = createOptionsResponse();
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('should not include Content-Type header', () => {
      const response = createOptionsResponse();
      expect(response.headers.get('Content-Type')).toBeNull();
    });
  });
});
