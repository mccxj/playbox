import { describe, it, expect } from 'vitest';
import { AuthManager } from '../../../src/managers/auth';
import { createMockRequest } from '../../factories';

describe('AuthManager', () => {
  it('should accept valid API key from Authorization header', () => {
    const request = createMockRequest('/test', {
      headers: { 'Authorization': 'Bearer sk-1234' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should accept valid API key from x-api-key header', () => {
    const request = createMockRequest('/test', {
      headers: { 'x-api-key': 'sk-1234' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should accept valid API key from x-goog-api-key header', () => {
    const request = createMockRequest('/test', {
      headers: { 'x-goog-api-key': 'sk-1234' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should accept valid API key from URL query parameter', () => {
    const request = createMockRequest('/test?key=sk-1234', {
      headers: {}
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should reject invalid token', () => {
    const request = createMockRequest('/test', {
      headers: { 'Authorization': 'Bearer wrong-token' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(false);
  });

  it('should reject request with no authentication', () => {
    const request = createMockRequest('/test', {
      headers: {}
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(false);
  });

  it('should handle Bearer token with extra whitespace', () => {
    const request = createMockRequest('/test', {
      headers: { 'Authorization': 'Bearer   sk-1234  ' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should handle x-api-key with extra whitespace', () => {
    const request = createMockRequest('/test', {
      headers: { 'x-api-key': '  sk-1234  ' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should handle x-goog-api-key with extra whitespace', () => {
    const request = createMockRequest('/test', {
      headers: { 'x-goog-api-key': '  sk-1234  ' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should handle URL query parameter with extra whitespace', () => {
    const request = createMockRequest('/test?key=%20%20sk-1234%20%20', {
      headers: {}
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should prioritize Authorization header over other methods', () => {
    const request = createMockRequest('/test?key=wrong-key', {
      headers: {
        'Authorization': 'Bearer sk-1234',
        'x-api-key': 'wrong-key',
        'x-goog-api-key': 'wrong-key'
      }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should prioritize x-goog-api-key over x-api-key', () => {
    const request = createMockRequest('/test', {
      headers: {
        'x-api-key': 'wrong-key',
        'x-goog-api-key': 'sk-1234'
      }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(true);
  });

  it('should return false when AUTH_TOKEN is undefined', () => {
    const request = createMockRequest('/test', {
      headers: { 'Authorization': 'Bearer sk-1234' }
    });
    const env = {} as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(false);
  });

  it('should reject empty Bearer token', () => {
    const request = createMockRequest('/test', {
      headers: { 'Authorization': 'Bearer ' }
    });
    const env = { AUTH_TOKEN: 'sk-1234' } as any;

    const result = AuthManager.verify(request, env);
    expect(result).toBe(false);
  });
});