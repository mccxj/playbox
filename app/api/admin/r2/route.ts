import { NextRequest } from 'next/server';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

interface R2BucketInfo {
	binding: string;
	bucket_name: string;
}

// DISABLED: R2 temporarily disabled for deployment without R2 binding
export async function GET(_request: NextRequest) {
	// return createJsonResponse({
	// 	success: true,
	// 	buckets: [{ binding: 'PLAYBOX_R2', bucket_name: 'playbox-r2' }],
	// });
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}
