export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

export interface TableSchema {
  name: string;
  sql: string | null;
  columns: ColumnInfo[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  columns?: ColumnInfo[];
  rows: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TableRow extends Record<string, unknown> {
  _rowid: number;
}

export interface TablesResponse {
  success: boolean;
  tables: TableSchema[];
}

export interface BatchDeleteResponse {
  success: boolean;
  message: string;
  affected: number;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
}
