/**
 * Database abstraction layer types
 *
 * Defines the SqlClient interface that abstracts database operations.
 * Implementations can be D1, Turso, Supabase, or any SQL database.
 */

/** A prepared SQL statement that can be executed with bound parameters */
export interface Statement {
  bind(...params: (string | number | null | boolean)[]): BoundStatement;
}

/** An executable statement after binding parameters */
export interface BoundStatement {
  all(): Promise<QueryResults>;
  first<T extends QueryResultRow = QueryResultRow>(): Promise<QueryFirstResult<T>>;
  run(): Promise<RunResult>;
}

/** A row returned from a query */
export type QueryResultRow = Record<string, unknown>;

/** Results from a query that returns multiple rows */
export interface QueryResults {
  results: QueryResultRow[];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

/** Result from a query that returns a single row */
export interface QueryFirstResult<T extends QueryResultRow = QueryResultRow> {
  results: T | null;
}

/** Result from an INSERT/UPDATE/DELETE operation */
export interface RunResult {
  results: [];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

/** Result from a batch of SQL statements */
export interface BatchResult {
  results: RunResult[];
  success: boolean;
}

/**
 * SqlClient interface - abstract database operations
 *
 * Business code should depend on this interface, not on specific implementations.
 * This allows swapping between D1, Turso, Supabase, etc. without changing business logic.
 */
export interface SqlClient {
  prepare(sql: string): Statement;
  batch(statements: string[]): Promise<BatchResult>;
  dump(): Promise<string>;
  exec(sql: string): Promise<RunResult>;
}