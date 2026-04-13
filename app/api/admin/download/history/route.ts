import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface DownloadRecord {
  id: string;
  url: string;
  filename: string;
  size: number;
  status: string;
  error: string | null;
  range_header: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * GET /api/admin/download/history
 * Fetch download history with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { env } = getRequestContext() as any;
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search');

    const offset = (page - 1) * pageSize;

    // Build WHERE clause
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    if (search) {
      whereClauses.push('(url LIKE ? OR filename LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sort mapping
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'size' ? 'size' : sortBy === 'status' ? 'status' : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM download_history ${whereClause}`;
    const countResult = await db.prepare(countQuery).bind(...params).all();
    const total = (countResult.results as any[])[0]?.total || 0;

    // Get records
    const query = `
      SELECT id, url, filename, size, status, error, range_header, created_at, completed_at
      FROM download_history
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, pageSize, offset];
    const result = await db.prepare(query)
      .bind(...queryParams)
      .all();

    const records = (result.results as DownloadRecord[]).map((r) => ({
      id: r.id,
      url: r.url,
      filename: r.filename,
      size: r.size,
      status: r.status as 'pending' | 'success' | 'failed',
      error: r.error || undefined,
      rangeHeader: r.range_header || undefined,
      createdAt: r.created_at,
      completedAt: r.completed_at || undefined
    }));

    return createJsonResponse({
      success: true,
      records,
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Error fetching download history:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
