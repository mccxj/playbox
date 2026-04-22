export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type BodyFormat = 'json' | 'form' | 'raw';

export interface HeaderEntry {
  key: string;
  value: string;
}

export interface ApiTestRequest {
  method: HttpMethod;
  url: string;
  headers: HeaderEntry[];
  body: string;
  bodyFormat: BodyFormat;
}

export interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export interface ApiTestHistoryRecord {
  id: string;
  method: string;
  url: string;
  headers: string;
  body: string;
  bodyFormat: string;
  responseStatus: number | null;
  responseHeaders: string | null;
  responseBody: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ExecuteApiResponse {
  success: boolean;
  data?: ApiTestResponse;
  error?: string;
  historyId?: string;
}

export interface HistoryListResponse {
  success: boolean;
  data?: {
    records: ApiTestHistoryRecord[];
    total: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}
