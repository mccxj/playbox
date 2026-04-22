import { CORS_HEADERS } from '../utils/constants';

export function createJsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export function createUnauthorizedResponse(message = 'Incorrect API key provided.'): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: 'invalid_request_error',
      },
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

export function createNotFoundResponse(message = 'Endpoint not found'): Response {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

export function createInternalErrorResponse(message = 'Internal Server Error'): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        type: 'internal_error',
      },
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

export function createOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
