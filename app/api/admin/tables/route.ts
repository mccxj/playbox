import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { createJsonResponse, createInternalErrorResponse } from '@/lib/response-helpers';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface TableInfo {
  name: string;
  sql: string | null;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface TableSchema {
  name: string;
  sql: string | null;
  columns: ColumnInfo[];
}

/**
 * GET /api/admin/tables
 * Returns list of all tables with their column definitions
 */
export async function GET(request: NextRequest) {
  try {
    // Get Cloudflare bindings from global context
    const { env } = getRequestContext() as any;
    const db = env.PLAYBOX_D1;

    if (!db) {
      return createJsonResponse({ error: 'D1 database not configured' }, 500);
    }

    // Get all user tables (exclude system tables)
    const tablesResult = await db.prepare(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type = 'table' 
        AND name NOT LIKE 'sqlite_%' 
        AND name NOT LIKE '_cf_%'
      ORDER BY name
    `).all();

    const tables = tablesResult.results as TableInfo[];

    // Get column info for each table
    const tableSchemas: TableSchema[] = [];

    for (const table of tables) {
      const columnsResult = await db.prepare(`PRAGMA table_info(${table.name})`).all();
      tableSchemas.push({
        name: table.name,
        sql: table.sql,
        columns: columnsResult.results as ColumnInfo[]
      });
    }

    return createJsonResponse({
      success: true,
      tables: tableSchemas
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return createInternalErrorResponse((error as Error).message);
  }
}
