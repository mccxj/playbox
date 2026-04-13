# Managers

**Location:** `src/managers/`

## OVERVIEW

Core business logic for authentication and API key management. Handles token refresh, key rotation, and D1/KV caching.

## STRUCTURE

```
managers/
├── index.ts # Barrel exports
├── auth.ts # API key verification
└── key.ts # KeyManager: token refresh, D1/KV operations
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Token refresh | `key.ts` | `KeyManager.getValidAccessToken()` |
| API key rotation | `key.ts` | `KeyManager.getRandomApiKey()` |
| D1 key queries | `key.ts` | `security_keys` table |
| KV caching | `key.ts` | 300s TTL for keys, 3500s for tokens |

## CONVENTIONS

- **Exported object**: `KeyManager` object with async methods
- **KV caching**: Tokens cached in `PLAYBOX_KV` with TTL
- **D1 storage**: API keys stored in D1 `security_keys` table
- **Gemini OAuth**: Automatic token refresh with 3500s cache TTL
- **Random key selection**: `getRandomApiKey()` fetches 100 keys, picks random one

## ANTI-PATTERNS

- **DO NOT** skip KV caching — D1 queries are expensive
- **DO NOT** return expired tokens — always check `expiresAt` with 60s buffer
- **DO NOT** store keys in code — use D1 + KV only

## NOTES

- **Key cache TTL**: 300s (5 minutes)
- **Token cache TTL**: 3500s (~58 minutes)
- **Key batch size**: 100 keys fetched for random selection
