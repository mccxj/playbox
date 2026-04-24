/**
 * API key masking for analytics — records only the prefix portion
 * to enable per-key usage stats without exposing full keys.
 */

export function maskApiKey(apiKey: string | null | undefined): string {
  if (!apiKey || apiKey === 'anonymous') return 'anonymous';
  if (apiKey.length <= 8) return apiKey;
  return apiKey.substring(0, 8) + '****';
}
