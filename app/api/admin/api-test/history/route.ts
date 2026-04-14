import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
	try {
		const { env } = getCloudflareContext() as any;
		const db = env.PLAYBOX_D1;

		if (!db) {
			return createJsonResponse({ error: 'D1 database not configured' }, 500);
		}

		const url = new URL(request.url);
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
		const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(url.searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)));
		const search = url.searchParams.get('search');

		const offset = (page - 1) * pageSize;
		const whereClause = search ? 'WHERE url LIKE ? OR method LIKE ?' : '';
		const bindParams = search ? [`%${search}%`, `%${search}%`] : [];

		const countResult = await db.prepare(`
			SELECT COUNT(*) as total FROM api_test_history ${whereClause}
		`).bind(...bindParams).first();

		const total = (countResult as any)?.total || 0;

		const rowsResult = await db.prepare(`
			SELECT * FROM api_test_history
			${whereClause}
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`).bind(...bindParams, pageSize, offset).all();

		const records = (rowsResult.results as any[]).map((row) => ({
			id: row.id,
			method: row.method,
			url: row.url,
			headers: row.headers,
			body: row.body,
			bodyFormat: row.body_format,
			responseStatus: row.response_status,
			responseHeaders: row.response_headers,
			responseBody: row.response_body,
			durationMs: row.duration_ms,
			errorMessage: row.error_message,
			createdAt: row.created_at,
		}));

		return createJsonResponse({
			success: true,
			data: {
				records,
				total,
				page,
				pageSize,
			},
		});
	} catch (error) {
		console.error('Error fetching API test history:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function POST(request: NextRequest) {
	try {
		const { env } = getCloudflareContext() as any;
		const db = env.PLAYBOX_D1;

		if (!db) {
			return createJsonResponse({ error: 'D1 database not configured' }, 500);
		}

		const body = await request.json() as {
			method: string;
			url: string;
			headers?: string;
			body?: string;
			bodyFormat?: string;
			responseStatus?: number;
			responseHeaders?: string;
			responseBody?: string;
			durationMs?: number;
			errorMessage?: string;
		};

		const id = crypto.randomUUID();

		await db.prepare(`
			INSERT INTO api_test_history (id, method, url, headers, body, body_format, response_status, response_headers, response_body, duration_ms, error_message)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`).bind(
			id,
			body.method,
			body.url,
			body.headers || null,
			body.body || null,
			body.bodyFormat || 'json',
			body.responseStatus ?? null,
			body.responseHeaders || null,
			body.responseBody || null,
			body.durationMs ?? null,
			body.errorMessage || null
		).run();

		return createJsonResponse({
			success: true,
			data: { id },
		}, 201);
	} catch (error) {
		console.error('Error saving API test history:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { env } = getCloudflareContext() as any;
		const db = env.PLAYBOX_D1;

		if (!db) {
			return createJsonResponse({ error: 'D1 database not configured' }, 500);
		}

		const url = new URL(request.url);
		const id = url.searchParams.get('id');

		if (id) {
			await db.prepare('DELETE FROM api_test_history WHERE id = ?').bind(id).run();
			return createJsonResponse({ success: true });
		}

		const olderThan = url.searchParams.get('olderThan');
		if (olderThan) {
			await db.prepare('DELETE FROM api_test_history WHERE created_at < ?').bind(olderThan).run();
			return createJsonResponse({ success: true });
		}

		await db.prepare('DELETE FROM api_test_history').run();
		return createJsonResponse({ success: true });
	} catch (error) {
		console.error('Error deleting API test history:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}
