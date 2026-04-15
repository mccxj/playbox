import { NextRequest } from 'next/server';
// import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse /*, createInternalErrorResponse, createNotFoundResponse */ } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

// DISABLED: R2 temporarily disabled for deployment without R2 binding
export async function GET(request: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
	// const { env } = getCloudflareContext() as any;
	// const { bucket } = await params;
	// ... original implementation
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}

// DISABLED: R2 temporarily disabled for deployment without R2 binding
export async function POST(request: NextRequest, { params }: { params: Promise<{ bucket: string }> }) {
	// const { env } = getCloudflareContext() as any;
	// const { bucket } = await params;
	// ... original implementation
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}
