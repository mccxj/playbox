# Platforms

**Location:** `src/platforms/`

## OVERVIEW

Platform abstraction layer for multi-platform deployment support.
Provides unified access to platform-specific resources across
Cloudflare Workers, Vercel, Node.js, and other environments.

## STRUCTURE

```
platforms/
├── index.ts    # Main entry point - getPlatformDb(), getPlatformContext()
└── types.ts    # PlatformContext, PlatformEnv, PlatformType interfaces
```

## WHERE TO LOOK

| Task                    | Location      | Notes                          |
|-------------------------|---------------|--------------------------------|
| Get database client     | `index.ts`    | `getPlatformDb()`              |
| Platform detection      | `index.ts`    | `detectPlatform()`, `isPlatform()` |
| Platform types          | `types.ts`    | `PlatformType`, `PlatformContext` |

## USAGE

```typescript
import { getPlatformDb, getPlatformType } from '@/platforms';

// Get database (null if not available)
const db = getPlatformDb();
if (!db) {
  throw new Error('Database not available on this platform');
}

// Query database
const { results } = await db.prepare('SELECT * FROM users').all();

// Check platform
if (isPlatform('cloudflare')) {
  // Cloudflare-specific code
}
```

## PLATFORM SUPPORT

| Platform     | Database    | Notes                              |
|--------------|-------------|-----------------------------------|
| Cloudflare   | D1          | Full support via getCloudflareContext() |
| Vercel       | PostgreSQL  | Planned (not yet implemented)     |
| Node.js      | None        | For local development/testing     |

## CONVENTIONS

- **Singleton pattern**: Platform context is cached at module level
- **Lazy initialization**: Context is created on first access
- **Graceful degradation**: Returns null for unavailable resources
- **Test helpers**: `resetPlatformContext()`, `setPlatformContext()` for testing