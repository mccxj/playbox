import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse, createInternalErrorResponse, createNotFoundResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const { searchParams } = new URL(request.url);
		const prefix = searchParams.get('prefix') || '';
		const cursor = searchParams.get('cursor') || undefined;
		const limit = parseInt(searchParams.get('limit') || '100', 10);

		const result = await r2.list({
			prefix,
			cursor,
			limit,
			include: ['httpMetadata', 'customMetadata'],
		});

		return createJsonResponse({
			success: true,
			objects: result.objects.map((obj: any) => ({
				key: obj.key,
				size: obj.size,
				etag: obj.etag,
				httpEtag: obj.httpEtag,
				uploaded: obj.uploaded,
				contentType: obj.httpMetadata?.contentType,
				customMetadata: obj.customMetadata,
			})),
			delimitedPrefixes: result.delimitedPrefixes || [],
			truncated: result.truncated,
			cursor: result.cursor,
		});
	} catch (error) {
		console.error('Error listing R2 objects:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
	try {
		const { env } = getCloudflareContext() as any;
		const { bucket } = await params;

		const r2 = env[bucket];

		if (!r2) {
			return createNotFoundResponse(`R2 bucket '${bucket}' not found`);
		}

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const key = formData.get('key') as string;
		const customMetadataStr = formData.get('customMetadata') as string | null;

		if (!file || !key) {
			return createJsonResponse({ error: 'File and key are required' }, 400);
		}

		const customMetadata = customMetadataStr ? JSON.parse(customMetadataStr) : undefined;

		const result = await r2.put(key, file.stream(), {
			httpMetadata: {
				contentType: file.type,
			},
			customMetadata,
		});

		return createJsonResponse({
			success: true,
			key: result.key,
			size: result.size,
			etag: result.etag,
			uploaded: result.uploaded,
		});
	} catch (error) {
		console.error('Error uploading R2 object:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}
