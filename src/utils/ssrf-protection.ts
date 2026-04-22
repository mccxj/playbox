export interface SSRFValidationResult {
  isValid: boolean;
  error?: string;
}

const PRIVATE_IPV4_RANGES: { start: number; end: number; name: string }[] = [
  { start: 0x7f000000, end: 0x7fffffff, name: '127.0.0.0/8 (loopback)' },
  { start: 0x0a000000, end: 0x0affffff, name: '10.0.0.0/8 (private)' },
  { start: 0xac100000, end: 0xac1fffff, name: '172.16.0.0/12 (private)' },
  { start: 0xc0a80000, end: 0xc0a8ffff, name: '192.168.0.0/16 (private)' },
  { start: 0xa9fe0000, end: 0xa9feffff, name: '169.254.0.0/16 (link-local)' },
  { start: 0x00000000, end: 0x00ffffff, name: '0.0.0.0/8 (this network)' },
  { start: 0xe0000000, end: 0xefffffff, name: '224.0.0.0/4 (multicast)' },
  { start: 0xf0000000, end: 0xffffffff, name: '240.0.0.0/4 (reserved)' },
];

function ipv4ToNumber(ip: string): number {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) {
    return -1;
  }
  return parts[0] * 0x1000000 + parts[1] * 0x10000 + parts[2] * 0x100 + parts[3];
}

function isPrivateIPv4(ip: string): string | null {
  const num = ipv4ToNumber(ip);
  if (num === -1) return null;

  for (const range of PRIVATE_IPV4_RANGES) {
    if (num >= range.start && num <= range.end) {
      return range.name;
    }
  }
  return null;
}

function isPrivateIPv6(ip: string): string | null {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return '::1 (loopback)';
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return 'fc00::/7 (unique local)';
  }

  if (normalized.startsWith('fe80') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return 'fe80::/10 (link-local)';
  }

  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.replace('::ffff:', '');
    return isPrivateIPv4(ipv4Part);
  }

  return null;
}

export function validateSafeUrl(urlString: string): SSRFValidationResult {
  if (!urlString || typeof urlString !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  urlString = urlString.trim();

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  const allowedProtocols = ['http:', 'https:'];
  if (!allowedProtocols.includes(url.protocol)) {
    return { isValid: false, error: `Protocol "${url.protocol}" is not allowed. Only http and https are supported.` };
  }

  const hostname = url.hostname;

  const ipv4Match = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
  if (ipv4Match) {
    const blockedReason = isPrivateIPv4(hostname);
    if (blockedReason) {
      return { isValid: false, error: `Access denied: ${blockedReason}` };
    }
  }

  if (hostname.includes(':')) {
    const blockedReason = isPrivateIPv6(hostname);
    if (blockedReason) {
      return { isValid: false, error: `Access denied: ${blockedReason}` };
    }
  }

  const blockedDomains = ['localhost', 'localhost.localdomain', 'ip6-localhost', 'ip6-loopback'];
  if (blockedDomains.includes(hostname.toLowerCase())) {
    return { isValid: false, error: `Access denied: ${hostname} is a blocked domain` };
  }

  const blockedTlds = ['.local', '.internal', '.localhost', '.localdomain'];
  for (const tld of blockedTlds) {
    if (hostname.toLowerCase().endsWith(tld)) {
      return { isValid: false, error: `Access denied: ${hostname} uses blocked TLD` };
    }
  }

  if (/^\d+$/.test(hostname)) {
    const decimalIp = parseInt(hostname, 10);
    if (!isNaN(decimalIp) && decimalIp >= 0 && decimalIp <= 4294967295) {
      const octet1 = (decimalIp >>> 24) & 255;
      const octet2 = (decimalIp >>> 16) & 255;
      const octet3 = (decimalIp >>> 8) & 255;
      const octet4 = decimalIp & 255;
      const dottedIp = `${octet1}.${octet2}.${octet3}.${octet4}`;
      const blockedReason = isPrivateIPv4(dottedIp);
      if (blockedReason) {
        return { isValid: false, error: `Access denied: decimal IP resolves to ${dottedIp}` };
      }
    }
  }

  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    const hexIp = parseInt(hostname, 16);
    if (!isNaN(hexIp) && hexIp >= 0 && hexIp <= 4294967295) {
      const octet1 = (hexIp >>> 24) & 255;
      const octet2 = (hexIp >>> 16) & 255;
      const octet3 = (hexIp >>> 8) & 255;
      const octet4 = hexIp & 255;
      const dottedIp = `${octet1}.${octet2}.${octet3}.${octet4}`;
      const blockedReason = isPrivateIPv4(dottedIp);
      if (blockedReason) {
        return { isValid: false, error: `Access denied: hex IP resolves to ${dottedIp}` };
      }
    }
  }

  const octalMatch = hostname.match(/^0[0-7]+(\.0[0-7]+)*\.0[0-7]+$/);
  if (octalMatch) {
    const parts = hostname.split('.').map((p) => parseInt(p, 8));
    const dottedIp = parts.join('.');
    const blockedReason = isPrivateIPv4(dottedIp);
    if (blockedReason) {
      return { isValid: false, error: `Access denied: octal IP resolves to ${dottedIp}` };
    }
  }

  return { isValid: true };
}

export async function validateSafeUrlAsync(urlString: string): Promise<SSRFValidationResult> {
  return validateSafeUrl(urlString);
}
