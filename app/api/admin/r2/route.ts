import { NextRequest } from 'next/server';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/r2
 * List objects in R2 bucket with optional prefix filtering
 */
export async function GET(request: NextRequest) {
	try {
		const { env } = getCloudflareContext() as any;
		const bucket = env.PLAYBOX_R2 as R2Bucket;

		if (!bucket) {
			return createJsonResponse({ error: 'R2 bucket not configured' }, 500);
		}

		const searchParams = request.nextUrl.searchParams;
		const prefix = searchParams.get('prefix') || '';
		const cursor = searchParams.get('cursor') || undefined;
		const limit = parseInt(searchParams.get('limit') || '50', 10);
		const delimiter = searchParams.get('delimiter') || undefined;

		const options: R2ListOptions = {
			prefix,
			limit: Math.min(limit, 100),
			cursor,
			delimiter,
		};

		const result = await bucket.list(options);

		const objects = result.objects.map((obj) => ({
			key: obj.key,
			size: obj.size,
			etag: obj.etag,
			lastModified: obj.uploaded.toISOString(),
			httpContentType: obj.httpMetadata?.contentType,
			httpEtag: obj.httpEtag,
		}));

		return createJsonResponse({
			success: true,
			objects,
			truncated: result.truncated,
			cursor: result.truncated ? result.cursor : undefined,
			delimitedPrefixes: result.delimitedPrefixes,
		});
	} catch (error) {
		console.error('Error listing R2 objects:', error);
		return createInternalErrorResponse((error as Error).message);
	}
}
