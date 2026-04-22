import { NextRequest } from 'next/server';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const dynamic = 'force-dynamic';

interface R2BucketInfo {
  binding: string;
  bucket_name: string;
}

export async function GET(_request: NextRequest) {
  try {
    const r2Buckets: R2BucketInfo[] = [
      {
        binding: 'PLAYBOX_R2',
        bucket_name: 'playbox-r2',
      },
    ];

    return createJsonResponse({
      success: true,
      buckets: r2Buckets,
    });
  } catch (error) {
    console.error('Error fetching R2 buckets:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
