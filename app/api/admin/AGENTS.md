# Admin API Routes

## OVERVIEW

Admin API endpoints for KV, D1 tables, analytics, downloads, and API testing with full CRUD and batch operations.

## STRUCTURE

```
api/admin/
├── kv/
│   ├── route.ts                    # List namespaces (GET)
│   ├── [namespace]/route.ts        # List/create keys (GET, POST)
│   ├── [namespace]/[key]/route.ts  # Key CRUD (GET, PUT, DELETE)
│   ├── [namespace]/batch/route.ts  # Batch delete (POST)
│   └── [namespace]/import/route.ts # Bulk import (POST)
├── r2/
│   ├── route.ts                    # List buckets (GET)
│   ├── [bucket]/route.ts           # Bucket operations (GET)
│   └── [bucket]/[key]/route.ts     # Object operations (GET, PUT, DELETE)
├── tables/
│   ├── route.ts                    # List tables with schemas (GET)
│   └── [table]/
│       ├── rows/route.ts           # List/create rows (GET, POST)
│       ├── rows/[rowid]/route.ts   # Row CRUD (GET, PUT, DELETE)
│       └── batch/route.ts          # Batch delete/import (POST)
├── analytics/route.ts              # Analytics Engine queries (GET)
├── download/history/route.ts       # Download history (GET)
├── api-test/route.ts               # Execute HTTP requests (POST)
├── api-test/history/route.ts       # Test history CRUD (GET, POST, DELETE)
├── llm-keys/route.ts               # LLM key management (GET, POST)
├── llm-keys/[id]/route.ts          # Single key operations (GET, PUT, DELETE)
├── short-url/route.ts              # Short URL CRUD (GET, POST, PUT, DELETE)
├── domains/route.ts                # Domain CRUD (GET, POST, PUT, DELETE)
├── email/route.ts                  # Email configuration (GET, PUT)
├── providers/route.ts              # Provider config (GET, POST, PUT, DELETE)
├── providers/speed-test/route.ts   # Provider speed test (POST)
└── providers/models/route.ts       # Provider models (GET)
```

## WHERE TO LOOK

| Task               | Location             | Notes                                                             |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| Add KV operation   | `kv/[namespace]/`    | Follow CRUD pattern with `getRequestContext()`                    |
| Add R2 operation   | `r2/[bucket]/`       | List/upload/download/delete objects                               |
| Add table endpoint | `tables/[table]/`    | Use `validateTable()` helper, `escapeColumnName()` for SQL safety |
| Batch operations   | `*/batch/route.ts`   | Support JSON/CSV import, batch delete                             |
| Analytics query    | `analytics/route.ts` | Cloudflare Analytics Engine SQL API                               |
| API test execution | `api-test/route.ts`  | SSRF validation via `validateSafeUrl()`                           |
| LLM key management | `llm-keys/`          | CRUD for LLM API keys in D1                                       |
| Short URL CRUD     | `short-url/`         | Create/resolve short URLs                                         |
| Domain management  | `domains/`           | Domain CRUD                                                       |
| Email config       | `email/`             | Email configuration (GET/PUT)                                     |
| Provider config    | `providers/`         | Provider CRUD + speed test + models                               |
| API test history   | `api-test/history/`  | Test execution history                                            |

## CONVENTIONS

- **Dynamic segments**: `[namespace]`, `[key]`, `[table]`, `[rowid]`
- **Context**: `getCloudflareContext()` from `@opennextjs/cloudflare` for Cloudflare bindings (KV, D1)
- **Validation**: `validateTable()` for D1, `escapeColumnName()` prevents SQL injection
- **Pagination**: Default 20-50 items, configurable via `limit`/`page`/`pageSize`
- **Response helpers**: Use `createJsonResponse()`, `createInternalErrorResponse()`, `createNotFoundResponse()`

## ANTI-PATTERNS

- **DO NOT** skip table validation — use `validateTable()` before all D1 operations
- **DO NOT** use raw column names in SQL — always use `escapeColumnName()`
- **DO NOT** skip SSRF validation — all external URLs in api-test must use `validateSafeUrl()`
- **DO NOT** expose secrets — API keys from env vars, never hardcoded
