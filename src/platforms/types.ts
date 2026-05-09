/**
 * Platform abstraction layer types
 *
 * Provides a unified interface for accessing platform-specific resources
 * across different deployment targets (Cloudflare, Vercel, Node.js, etc.)
 */

import type { SqlClient } from '../db/types';

/** Supported platform types */
export type PlatformType = 'cloudflare' | 'vercel' | 'nodejs' | 'other';

/**
 * Platform environment interface
 * Abstracts platform-specific environment variables and bindings
 */
export interface PlatformEnv {
  /** Platform type identifier */
  platformType: PlatformType;

  /** Primary database connection */
  primaryDb: SqlClient | null;

  /** AUTH_TOKEN for API key validation */
  authToken?: string;
}

/**
 * Platform context interface
 * Provides runtime access to platform resources
 */
export interface PlatformContext {
  /**
   * Get the primary database client
   * Returns null if no database is available on this platform
   */
  getDatabase(): SqlClient | null;

  /**
   * Get the current platform type
   */
  getPlatformType(): PlatformType;

  /**
   * Check if running on a specific platform
   */
  isPlatform(platform: PlatformType): boolean;

  /**
   * Get the platform environment
   */
  getEnv(): PlatformEnv;

  /**
   * Optional execution context (Cloudflare only)
   * Uses compatible interface from src/protocols/types.ts
   */
  getExecutionContext?(): {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
  } | undefined;
}