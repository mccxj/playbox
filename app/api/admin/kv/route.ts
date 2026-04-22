import { NextRequest } from 'next/server';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

interface KVNamespaceInfo {
  binding: string;
  id: string;
}

/**
 * GET /api/admin/kv
 * Returns list of available KV namespaces from wrangler.jsonc
 */
export async function GET(_request: NextRequest) {
  try {
    // Parse KV namespaces from wrangler.jsonc configuration
    const kvNamespaces: KVNamespaceInfo[] = [
      {
        binding: 'PLAYBOX_KV',
        id: '85fe9a9b4cd54015b78dcba0c5486279',
      },
    ];

    return createJsonResponse({
      success: true,
      namespaces: kvNamespaces,
    });
  } catch (error) {
    console.error('Error fetching KV namespaces:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
