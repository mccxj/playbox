import { NextRequest } from 'next/server';
import { CORS_HEADERS } from '@/utils/constants';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';
import { validateSafeUrl } from '@/utils/ssrf-protection';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function logDownload(url: string, filename: string, size: number, status: string, error?: string, rangeHeader?: string): Promise<void> {
	try {
		const { env } = getCloudflareContext() as any;
		const db = env.PLAYBOX_D1;

		if (!db) {
			console.warn('D1 database not configured, skipping download logging');
			return;
		}

		const id = crypto.randomUUID();

		await db.prepare(`
			INSERT INTO download_history (id, url, filename, size, status, error, range_header, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
		`).bind(id, url, filename, size, status, error || null, rangeHeader || null).run();
	} catch (logError) {
		console.error('Failed to log download:', logError);
	}
}

export async function GET(request: NextRequest): Promise<Response> {
	const urlParam = request.nextUrl.searchParams.get('url');

	if (!urlParam) {
		return createJsonResponse({ error: 'URL parameter is required' }, 400);
	}

	const validation = validateSafeUrl(urlParam);
	if (!validation.isValid) {
		return createJsonResponse({ error: validation.error || 'Access denied' }, 403);
	}

	const rangeHeader = request.headers.get('Range');

	try {
		const fetchHeaders: HeadersInit = {
			'User-Agent': 'Playbox-Download-Proxy/1.0',
		};

		if (rangeHeader) {
			fetchHeaders['Range'] = rangeHeader;
		}

		const response = await fetch(urlParam, {
			method: 'GET',
			headers: fetchHeaders,
			redirect: 'follow',
		});

		if (!response.ok && response.status !== 206) {
			try {
				await logDownload(urlParam, extractFilename(urlParam, response), 0, 'failed', `HTTP ${response.status}: ${response.statusText}`, rangeHeader ?? undefined);
			} catch (logError) {
				console.error('Failed to log download failure:', logError);
			}

			return createJsonResponse(
				{
					error: `Failed to download: ${response.status} ${response.statusText}`,
				},
				response.status
			);
		}

		const filename = extractFilename(urlParam, response);
		const contentLength = response.headers.get('Content-Length');
		const size = contentLength ? parseInt(contentLength, 10) : 0;

		try {
			await logDownload(urlParam, filename, size, 'success', undefined, rangeHeader ?? undefined);
		} catch (logError) {
			console.error('Failed to log download success:', logError);
		}

		const headers = new Headers();

		const contentType = response.headers.get('Content-Type');
		if (contentType) {
			headers.set('Content-Type', contentType);
		}

		if (contentLength) {
			headers.set('Content-Length', contentLength);
		}

		headers.set('Content-Disposition', `attachment; filename="${filename}"`);

		if (response.status === 206) {
			const contentRange = response.headers.get('Content-Range');
			const acceptRanges = response.headers.get('Accept-Ranges');

			if (contentRange) {
				headers.set('Content-Range', contentRange);
			}
			if (acceptRanges) {
				headers.set('Accept-Ranges', acceptRanges);
			}
		}

		for (const [key, value] of Object.entries(CORS_HEADERS)) {
			headers.set(key, value);
		}

		return new Response(response.body, {
			status: response.status,
			headers,
		});
	} catch (error) {
		console.error('Download error:', error);

		const fallbackFilename = extractFilenameFromUrl(urlParam);

		try {
			await logDownload(urlParam, fallbackFilename, 0, 'failed', error instanceof Error ? error.message : 'Download failed', rangeHeader ?? undefined);
		} catch (logError) {
			console.error('Failed to log download failure:', logError);
		}

		const errorMessage = error instanceof Error ? error.message : 'Download failed';
		return createInternalErrorResponse(errorMessage);
	}
}

export async function OPTIONS(): Promise<Response> {
	return new Response(null, {
		status: 204,
		headers: CORS_HEADERS,
	});
}

function extractFilenameFromUrl(urlString: string): string {
	try {
		const url = new URL(urlString);
		const pathname = url.pathname;
		const filename = pathname.split('/').pop();

		if (filename && filename.length > 0 && filename !== '/') {
			try {
				return decodeURIComponent(filename);
			} catch {
				return filename;
			}
		}
	} catch {
		return 'download';
	}

	return 'download';
}

function extractFilename(urlString: string, response: Response): string {
	const contentDisposition = response.headers.get('Content-Disposition');
	if (contentDisposition) {
		const filenameMatch = contentDisposition.match(/filename[^;=\n]*=(([']).*?\2|[^;\n]*)/);
		if (filenameMatch && filenameMatch[1]) {
			return filenameMatch[1].replace(/['"]/g, '');
		}
	}

	try {
		const url = new URL(urlString);
		const pathname = url.pathname;
		const filename = pathname.split('/').pop();

		if (filename && filename.length > 0 && filename !== '/') {
			try {
				return decodeURIComponent(filename);
			} catch {
				return filename;
			}
		}
	} catch {
		return 'download';
	}

	return 'download';
}