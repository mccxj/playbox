/**
 * R2 bucket types for Cloudflare R2 object storage
 */

export interface R2BucketInfo {
  binding: string;
  bucket_name: string;
}

export interface R2ObjectInfo {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
  httpEtag: string;
}

export interface R2ObjectWithMetadata extends R2ObjectInfo {
  metadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

export interface R2ListOptions {
  prefix?: string;
  cursor?: string;
  limit?: number;
  delimiter?: string;
}

export interface R2ListResult {
  objects: R2ObjectInfo[];
  delimitedPrefixes?: string[];
  truncated: boolean;
  cursor?: string;
}
