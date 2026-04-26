import { NextRequest } from 'next/server';
import { getTypedContext } from '@/lib/cloudflare-context';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';
import { validateSafeUrl } from '@/utils/ssrf-protection';

export const dynamic = 'force-dynamic';

interface HeaderEntry {
  key: string;
  value: string;
}

type BodyFormat = 'json' | 'form' | 'raw';

interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

function headersToObject(headers: HeaderEntry[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    if (h.key && h.value) {
      result[h.key] = h.value;
    }
  }
  return result;
}

function getContentType(format: BodyFormat): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'form':
      return 'application/x-www-form-urlencoded';
    case 'raw':
    default:
      return 'text/plain';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = getTypedContext();
    const db = env.PLAYBOX_D1;

    const body = (await request.json()) as {
      method: string;
      url: string;
      headers?: HeaderEntry[];
      body?: string;
      bodyFormat?: BodyFormat;
      saveHistory?: boolean;
    };

    const { method, url, headers = [], body: requestBody = '', bodyFormat = 'json', saveHistory = true } = body;

    const ssrfResult = validateSafeUrl(url);
    if (!ssrfResult.isValid) {
      return createJsonResponse(
        {
          success: false,
          error: ssrfResult.error || 'Invalid URL',
        },
        400
      );
    }

    const startTime = Date.now();
    let response: Response;
    let responseData: ApiTestResponse;

    try {
      const requestHeaders = headersToObject(headers);
      if (!requestHeaders['Content-Type'] && requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        requestHeaders['Content-Type'] = getContentType(bodyFormat);
      }

      response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: ['GET', 'HEAD'].includes(method) ? undefined : requestBody,
      });

      const responseBody = await response.text();

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration: Date.now() - startTime,
      };
    } catch (fetchError) {
      const duration = Date.now() - startTime;
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';

      if (saveHistory && db) {
        const id = crypto.randomUUID();
        await db
          .prepare(
            `
					INSERT INTO api_test_history (id, method, url, headers, body, body_format, error_message, duration_ms)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`
          )
          .bind(id, method, url, JSON.stringify(headers), requestBody, bodyFormat, errorMessage, duration)
          .run();
      }

      return createJsonResponse(
        {
          success: false,
          error: errorMessage,
        },
        200
      );
    }

    let historyId: string | undefined;
    if (saveHistory && db) {
      historyId = crypto.randomUUID();
      await db
        .prepare(
          `
				INSERT INTO api_test_history (id, method, url, headers, body, body_format, response_status, response_headers, response_body, duration_ms)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`
        )
        .bind(
          historyId,
          method,
          url,
          JSON.stringify(headers),
          requestBody,
          bodyFormat,
          responseData.status,
          JSON.stringify(responseData.headers),
          responseData.body,
          responseData.duration
        )
        .run();
    }

    return createJsonResponse({
      success: true,
      data: responseData,
      historyId,
    });
  } catch (error) {
    console.error('Error executing API test:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
