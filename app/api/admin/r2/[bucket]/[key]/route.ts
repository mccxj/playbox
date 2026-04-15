import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';
import { CORS_HEADERS } from '@/utils/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket, key } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const decodedKey = decodeURIComponent(key);
		const object = await r2.get(decodedKey);

		if (!object) {
			return createNotFoundResponse(`Object '${decodedKey}' not found`);
		}

		const headers = new Headers({
			'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
			'Content-Length': String(object.size),
			'ETag': object.httpEtag,
			'Last-Modified': object.uploaded.toUTCString(),
			...CORS_HEADERS,
		});

		if (object.customMetadata) {
			headers.set('X-Custom-Metadata', JSON.stringify(object.customMetadata));
		}

		return new Response(object.body, { headers });
	} catch (error) {
		console.error('Error getting R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket, key } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const decodedKey = decodeURIComponent(key);
		const body = await request.json() as { value?: string; contentType?: string; customMetadata?: Record<string, string> };

		if (body.value === undefined) {
			return createJsonResponse({ error: 'Value is required' }, 400);
		}

		const result = await r2.put(decodedKey, body.value, {
			httpMetadata: body.contentType ? { contentType: body.contentType } : undefined,
			customMetadata: body.customMetadata,
		});

		return createJsonResponse({
			success: true,
			key: result.key,
			size: result.size,
			etag: result.etag,
			uploaded: result.uploaded,
		});
	} catch (error) {
		console.error('Error updating R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket, key } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const decodedKey = decodeURIComponent(key);
		await r2.delete(decodedKey);

		return createJsonResponse({
			success: true,
			message: `Object '${decodedKey}' deleted successfully`,
		});
	} catch (error) {
		console.error('Error deleting R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket, key } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const decodedKey = decodeURIComponent(key);
		const object = await r2.head(decodedKey);

		if (!object) {
			return createNotFoundResponse(`Object '${decodedKey}' not found`);
		}

		return createJsonResponse({
			success: true,
			key: object.key,
			size: object.size,
			etag: object.etag,
			httpEtag: object.httpEtag,
			uploaded: object.uploaded,
			contentType: object.httpMetadata?.contentType,
			customMetadata: object.customMetadata,
		});
	} catch (error) {
		console.error('Error getting R2 object metadata:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}
