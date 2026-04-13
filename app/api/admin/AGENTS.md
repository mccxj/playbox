# Admin API Routes

## OVERVIEW
Admin API endpoints for KV, D1 tables, analytics, downloads, and API testing with full CRUD and batch operations.

## STRUCTURE
```
api/admin/
├── kv/
│   ├── route.ts                 # List namespaces (GET)
│   ├── [namespace]/route.ts     # List/create keys (GET, POST)
│   ├── [namespace]/[key]/route.ts  # Key CRUD (GET, PUT, DELETE)
│   ├── [namespace]/batch/route.ts  # Batch delete (POST)
│   └── [namespace]/import/route.ts # Bulk import (POST)
├── tables/
│   ├── route.ts                 # List tables with schemas (GET)
│   └── [table]/
│       ├── rows/route.ts        # List/create rows (GET, POST)
│       ├── rows/[rowid]/route.ts # Row CRUD (GET, PUT, DELETE)
│       └── batch/route.ts       # Batch delete/import (POST)
├── analytics/route.ts           # Analytics Engine queries (GET)
├── download/history/route.ts    # Download history (GET)
├── api-test/route.ts            # Execute HTTP requests (POST)
├── api-test/history/route.ts    # Test history CRUD (GET, POST, DELETE)
└── providers/models/route.ts    # Provider models (GET)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add KV operation | `kv/[namespace]/` | Follow CRUD pattern with `getRequestContext()` |
| Add table endpoint | `tables/[table]/` | Use `validateTable()` helper, `escapeColumnName()` for SQL safety |
| Batch operations | `*/batch/route.ts` | Support JSON/CSV import, batch delete |
| Analytics query | `analytics/route.ts` | Cloudflare Analytics Engine SQL API |
| API test execution | `api-test/route.ts` | SSRF validation via `validateSafeUrl()` |

## CONVENTIONS
- **Dynamic segments**: `[namespace]`, `[key]`, `[table]`, `[rowid]`
- **Context**: `getRequestContext()` for Cloudflare bindings (KV, D1)
- **Validation**: `validateTable()` for D1, `escapeColumnName()` prevents SQL injection
- **Pagination**: Default 20-50 items, configurable via `limit`/`page`/`pageSize`
- **Response helpers**: Use `createJsonResponse()`, `createInternalErrorResponse()`, `createNotFoundResponse()`

## ANTI-PATTERNS
- **DO NOT** skip table validation — use `validateTable()` before all D1 operations
- **DO NOT** use raw column names in SQL — always use `escapeColumnName()`
- **DO NOT** skip SSRF validation — all external URLs in api-test must use `validateSafeUrl()`
- **DO NOT** expose secrets — API keys from env vars, never hardcoded
