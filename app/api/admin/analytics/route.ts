import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

interface AnalyticsRow {
  model: string;
  stream_type: string;
  provider: string;
  count: number;
}

interface TimeSeriesRow {
  timestamp: string;
  model: string;
  count: number;
}

interface TokenRow {
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface TokenTimeSeriesRow {
  timestamp: string;
  model: string;
  total_tokens: number;
}

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const searchParams = request.nextUrl.searchParams;

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // ANALYTICS_API_TOKEN is a secret, must be set via: wrangler secret put ANALYTICS_API_TOKEN
  const envVars = env as unknown as Record<string, string | undefined>;
  const apiToken = envVars.ANALYTICS_API_TOKEN;
  const accountId = envVars.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    const missing: string[] = [];
    if (!apiToken) missing.push('ANALYTICS_API_TOKEN');
    if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID');
    return createJsonResponse(
      {
        success: false,
        error: `Analytics API not configured. Missing: ${missing.join(', ')}. Run: wrangler secret put <VAR_NAME>`,
      },
      500
    );
  }

  let timeCondition: string;
  if (startDate && endDate) {
    // Convert ISO 8601 format (YYYY-MM-DDTHH:mm:ss) to Analytics Engine format (YYYY-MM-DD HH:mm:ss)
    const startFormatted = startDate.replace('T', ' ');
    const endFormatted = endDate.replace('T', ' ');
    timeCondition = `timestamp >= toDateTime('${startFormatted}') AND timestamp <= toDateTime('${endFormatted}')`;
  } else {
    timeCondition = `timestamp >= NOW() - INTERVAL '1' DAY`;
  }

  const query = `
		SELECT 
			blob3 AS model,
			blob4 AS stream_type,
			blob5 AS provider,
			SUM(_sample_interval) AS count
		FROM playbox_events
		WHERE ${timeCondition}
			AND blob1 = 'llm_api'
		GROUP BY model, stream_type, provider
		ORDER BY count DESC
		LIMIT 1000
	`;

  const timeSeriesQuery = `
    SELECT
      toStartOfDay(timestamp) AS day,
      blob3 AS model,
      SUM(_sample_interval) AS count
    FROM playbox_events
    WHERE ${timeCondition}
    AND blob1 = 'llm_api'
    GROUP BY day, model
    ORDER BY day ASC
  `;

  const tokenQuery = `
    SELECT
      blob2 AS model,
      blob3 AS provider,
      SUM(double1) AS prompt_tokens,
      SUM(double2) AS completion_tokens,
      SUM(double3) AS total_tokens
    FROM playbox_events
    WHERE ${timeCondition}
    AND blob1 = 'llm_api_tokens'
    GROUP BY model, provider
    ORDER BY total_tokens DESC
    LIMIT 1000
  `;

  const tokenTimeSeriesQuery = `
    SELECT
      toStartOfDay(timestamp) AS day,
      blob2 AS model,
      SUM(double3) AS total_tokens
    FROM playbox_events
    WHERE ${timeCondition}
    AND blob1 = 'llm_api_tokens'
    GROUP BY day, model
    ORDER BY day ASC
  `;

  try {
    const [aggregatedResult, timeSeriesResult, tokenResult, tokenTimeSeriesResult] = await Promise.all([
      fetchAnalyticsQuery(apiToken, accountId, query),
      fetchAnalyticsQuery(apiToken, accountId, timeSeriesQuery),
      fetchAnalyticsQuery(apiToken, accountId, tokenQuery),
      fetchAnalyticsQuery(apiToken, accountId, tokenTimeSeriesQuery),
    ]);

    const aggregated: AnalyticsRow[] =
      (aggregatedResult as any[])?.map((row: any) => ({
        model: row.model || 'unknown',
        stream_type: row.stream_type || 'unknown',
        provider: row.provider || 'unknown',
        count: Number(row.count) || 0,
      })) || [];

    const timeSeries: TimeSeriesRow[] =
      (timeSeriesResult as any[])?.map((row: any) => ({
        timestamp: row.day || new Date().toISOString(),
        model: row.model || 'unknown',
        count: Number(row.count) || 0,
      })) || [];

    const tokenStats: TokenRow[] =
      (tokenResult as any[])?.map((row: any) => ({
        model: row.model || 'unknown',
        provider: row.provider || 'unknown',
        prompt_tokens: Number(row.prompt_tokens) || 0,
        completion_tokens: Number(row.completion_tokens) || 0,
        total_tokens: (Number(row.prompt_tokens) || 0) + (Number(row.completion_tokens) || 0),
      })) || [];

    const tokenTimeSeries: TokenTimeSeriesRow[] =
      (tokenTimeSeriesResult as any[])?.map((row: any) => ({
        timestamp: row.day || new Date().toISOString(),
        model: row.model || 'unknown',
        total_tokens: Number(row.total_tokens) || 0,
      })) || [];

    const totalRequests = aggregated.reduce((sum, row) => sum + row.count, 0);
    const totalTokens = tokenStats.reduce((sum, row) => sum + row.total_tokens, 0);
    const totalPromptTokens = tokenStats.reduce((sum, row) => sum + row.prompt_tokens, 0);
    const totalCompletionTokens = tokenStats.reduce((sum, row) => sum + row.completion_tokens, 0);

    return createJsonResponse({
      success: true,
      aggregated,
      timeSeries,
      totalRequests,
      tokenStats,
      tokenTimeSeries,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
    });
  } catch (error) {
    console.error('Analytics query error:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}

async function fetchAnalyticsQuery(apiToken: string, accountId: string, query: string): Promise<unknown[]> {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: query,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analytics API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as { data?: unknown[] };
  return data.data || [];
}
