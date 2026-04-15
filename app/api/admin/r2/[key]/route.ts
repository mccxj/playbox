import { NextRequest, NextResponse } from 'next/server';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CORS_HEADERS } from '@/utils/constants';

export const dynamic = 'force-dynamic';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ key: string }> }
) {
	try {
		const { env } = getCloudflareContext() as any;
		const bucket = env.PLAYBOX_R2 as R2Bucket;

		if (!bucket) {
			return createJsonResponse({ error: 'R2 bucket not configured' }, 500);
		}

		const { key } = await params;
		const decodedKey = decodeURIComponent(key);
		const rangeHeader = request.headers.get('Range') || undefined;

		const object = await bucket.get(decodedKey, {
			range: rangeHeader,
		});

		if (!object) {
			return createNotFoundResponse('Object not found');
		}

		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);

		if (rangeHeader && object.range) {
			const range = object.range;
			let offset: number;
			let end: number;

			if ('suffix' in range) {
				offset = object.size - range.suffix;
				end = object.size - 1;
			} else if ('offset' in range && range.offset !== undefined) {
				offset = range.offset;
				end = object.size - 1;
			} else {
				offset = 0;
				end = object.size - 1;
			}

			headers.set('Content-Range', `bytes ${offset}-${end}/${object.size}`);
		}

		for (const [k, v] of Object.entries(CORS_HEADERS)) {
			headers.set(k, v);
		}

		return new Response(object.body, {
			status: rangeHeader ? 206 : 200,
			headers,
		});
	} catch (error) {
		console.error('Error getting R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ key: string }> }
) {
	try {
		const { env } = getCloudflareContext() as any;
		const bucket = env.PLAYBOX_R2 as R2Bucket;

		if (!bucket) {
			return createJsonResponse({ error: 'R2 bucket not configured' }, 500);
		}

		const { key } = await params;
		const decodedKey = decodeURIComponent(key);

		const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
		const cacheControl = request.headers.get('Cache-Control') || undefined;
		const contentDisposition = request.headers.get('Content-Disposition') || undefined;

		const httpMetadata: R2HTTPMetadata = {
			contentType,
		};

		if (cacheControl) httpMetadata.cacheControl = cacheControl;
		if (contentDisposition) httpMetadata.contentDisposition = contentDisposition;

		const object = await bucket.put(decodedKey, request.body, {
			httpMetadata,
		});

		return createJsonResponse({
			success: true,
			key: object.key,
			etag: object.etag,
			size: object.size,
			uploaded: object.uploaded.toISOString(),
		});
	} catch (error) {
		console.error('Error uploading R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ key: string }> }
) {
	try {
		const { env } = getCloudflareContext() as any;
		const bucket = env.PLAYBOX_R2 as R2Bucket;

		if (!bucket) {
			return createJsonResponse({ error: 'R2 bucket not configured' }, 500);
		}

		const { key } = await params;
		const decodedKey = decodeURIComponent(key);

		await bucket.delete(decodedKey);

		return createJsonResponse({ success: true });
	} catch (error) {
		console.error('Error deleting R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: CORS_HEADERS,
	});
}
