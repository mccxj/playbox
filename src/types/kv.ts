/**
 * KV Storage Types for Cloudflare Workers
 */

export interface KVNamespaceInfo {
  binding: string;
  id: string;
}

export interface KVKeyInfo {
  name: string;
  expiration?: number;
}

export interface KVKeyValue {
  key: string;
  value: string;
  expiration?: number;
  metadata?: Record<string, any>;
}

export interface KVListParams {
  prefix?: string;
  cursor?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}

export interface KVListResponse {
  success: boolean;
  keys: KVKeyInfo[];
  list_complete: boolean;
  cursor?: string;
  prefix?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface KVGetResponse {
  success: boolean;
  key: string;
  value: string;
  expiration?: number;
  metadata?: Record<string, any>;
}

export interface KVWriteBody {
  value: string;
  expirationTtl?: number;
  metadata?: Record<string, any>;
}

export interface KVBatchDeleteBody {
  keys: string[];
}

export interface KVImportItem {
  key: string;
  value: string;
  expirationTtl?: number;
}

export interface KVImportBody {
  items: KVImportItem[];
}

export interface KVBatchResponse {
  success: boolean;
  message: string;
  processed: number;
  failed?: number;
}