import type { KVKeyInfo } from '@/types/kv';

/**
 * Type for displaying KV keys in table/list views with formatted expiration.
 */
export interface KVKeyDisplay extends KVKeyInfo {
  expirationFormatted?: string;
}

/**
 * Type for namespace selector options in dropdown/select components.
 */
export interface KVNamespaceOption {
  value: string; // binding name (e.g., 'PLAYBOX_KV')
  label: string; // display label (e.g., 'Main KV Store')
  id: string; // namespace ID
}

/**
 * Type for KV key creation and editing forms.
 */
export interface KVFormData {
  key: string;
  value: string;
  expirationTtl?: number; // TTL in seconds
}

/**
 * Type for KV import modal form data.
 */
export interface KVImportFormData {
  format: 'json' | 'key-value';
  data: string;
}
