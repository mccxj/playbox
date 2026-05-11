/**
 * Platform abstraction layer implementation
 *
 * Provides a unified interface for accessing platform resources
 * across different deployment targets.
 *
 * Usage:
 * import { getPlatformDb } from '@/platforms';
 * const db = getPlatformDb();
 */

import { createSqlClient } from '../db/factory';
import { d1RestAdapter } from '../db/index';
import type { PlatformContext, PlatformEnv, PlatformType } from './types';

// Augment the global CloudflareEnv interface from @opennextjs/cloudflare
// to include our custom bindings (PLAYBOX_D1, AUTH_TOKEN, etc.)
declare global {
  interface CloudflareEnv {
    PLAYBOX_D1?: import('@cloudflare/workers-types').D1Database;
    AUTH_TOKEN?: string;
    GEMINI_CLI_CLIENT_ID?: string;
    GEMINI_CLI_CLIENT_SECRET?: string;
    GEMINI_CLI_REDIRECT_URI?: string;
    GEMINI_CLI_ACCESS_TOKEN?: string;
    GEMINI_CLI_REFRESH_TOKEN?: string;
    GEMINI_CLI_EXPIRES_AT?: string;
  }
}

// Must match Symbol.for("__cloudflare-context__") used by @opennextjs/cloudflare
const CLOUDFLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__');

interface CloudflareContext {
  env: CloudflareEnv;
  ctx: unknown;
  cf: unknown;
}

let _context: PlatformContext | null = null;
let _platformDetected: PlatformType | null = null;

function getCloudflareContextFromGlobal(): CloudflareContext | undefined {
  return (globalThis as Record<symbol, unknown>)[CLOUDFLARE_CONTEXT_SYMBOL] as CloudflareContext | undefined;
}

function detectPlatform(): PlatformType {
  // OpenNext/cloudflare stores context on globalThis via this symbol in production Workers
  if (getCloudflareContextFromGlobal() !== undefined) {
    return 'cloudflare';
  }

  const globalStr = globalThis as Record<string, unknown>;
  if (globalStr.__ENV !== undefined || process.env.CF_PAGES === 'true') {
    return 'cloudflare';
  }

  if (process.env.VERCEL === 'true' || process.env.VERCEL_ENV) {
    return 'vercel';
  }

  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'nodejs';
  }

  return 'other';
}

function createCloudflareContext(): PlatformContext {
  return {
    getDatabase: () => {
      const ctx = getCloudflareContextFromGlobal();
      if (!ctx?.env?.PLAYBOX_D1) {
        return null;
      }
      return createSqlClient({ d1: ctx.env.PLAYBOX_D1 });
    },

    getPlatformType: () => 'cloudflare',

    isPlatform: (platform: PlatformType) => platform === 'cloudflare',

    getEnv: () => {
      const ctx = getCloudflareContextFromGlobal();
      return {
        platformType: 'cloudflare' as PlatformType,
        primaryDb: ctx?.env?.PLAYBOX_D1 ? createSqlClient({ d1: ctx.env.PLAYBOX_D1 }) : null,
        authToken: ctx?.env?.AUTH_TOKEN,
      };
    },

    getExecutionContext: () => {
      const ctx = getCloudflareContextFromGlobal();
      return ctx?.ctx as { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void } | undefined;
    },
  };
}

/**
 * Create Vercel platform context
 * Uses D1 REST API via Cloudflare credentials
 */
function createVercelContext(): PlatformContext {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  const hasD1Rest = accountId && databaseId && apiToken ? { accountId, databaseId, apiToken } : null;

  return {
    getDatabase: () => {
      if (!hasD1Rest) return null;
      return d1RestAdapter({
        accountId: hasD1Rest.accountId,
        databaseId: hasD1Rest.databaseId,
        apiToken: hasD1Rest.apiToken,
      });
    },

    getPlatformType: () => 'vercel',

    isPlatform: (platform: PlatformType) => platform === 'vercel',

    getEnv: () => ({
      platformType: 'vercel',
      primaryDb: hasD1Rest
        ? d1RestAdapter({
            accountId: hasD1Rest.accountId,
            databaseId: hasD1Rest.databaseId,
            apiToken: hasD1Rest.apiToken,
          })
        : null,
      authToken: process.env.AUTH_TOKEN,
    }),
  };
}

function createMockContext(): PlatformContext {
  return {
    getDatabase: () => null,

    getPlatformType: () => 'nodejs',

    isPlatform: (platform: PlatformType) => platform === 'nodejs',

    getEnv: (): PlatformEnv => ({
      platformType: 'nodejs',
      primaryDb: null,
      authToken: process.env.AUTH_TOKEN,
    }),
  };
}

function initPlatformContext(): PlatformContext {
  const platform = detectPlatform();
  _platformDetected = platform;

  switch (platform) {
    case 'cloudflare':
      return createCloudflareContext();
    case 'vercel':
      return createVercelContext();
    default:
      return createMockContext();
  }
}

function getContext(): PlatformContext {
  if (!_context) {
    _context = initPlatformContext();
  }
  return _context;
}

export function getPlatformDb(): import('../db/types').SqlClient | null {
  return getContext().getDatabase();
}

export function getPlatformType(): PlatformType {
  if (_platformDetected) return _platformDetected;
  return getContext().getPlatformType();
}

export function isPlatform(platform: PlatformType): boolean {
  return getContext().isPlatform(platform);
}

export function getPlatformEnv(): PlatformEnv {
  return getContext().getEnv();
}

export function getPlatformContext(): PlatformContext {
  return getContext();
}

export function resetPlatformContext(): void {
  _context = null;
  _platformDetected = null;
}

export function setPlatformContext(context: PlatformContext): void {
  _context = context;
}

export type { PlatformContext, PlatformEnv, PlatformType } from './types';
