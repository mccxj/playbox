import { NextRequest } from 'next/server';
// import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createJsonResponse /*, createInternalErrorResponse, createNotFoundResponse */ } from '@/lib/response-helpers';
// import { CORS_HEADERS } from '@/utils/constants';

export const dynamic = 'force-dynamic';

// DISABLED: R2 temporarily disabled for deployment without R2 binding
export async function GET(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ bucket: string; key: string }> }) {
	return createJsonResponse({ success: false, error: 'R2 is temporarily disabled' }, 503);
}
