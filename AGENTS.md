# PROJECT KNOWLEDGE BASE

**Stack:** Next.js 15 + TypeScript + Vitest + Wrangler + Ant Design + Recharts

## OVERVIEW

AI API Gateway & Protocol Converter — converts between AI provider protocols (OpenAI, Anthropic, Google, Gemini CLI) on Next.js with Cloudflare Workers deployment. Multi-protocol support with OAuth token management, D1 key storage, KV caching, R2 object storage, GitHub proxy, download proxy with SSRF protection, and Cloudflare Analytics Engine integration.

## STRUCTURE

```
./
├── app/ # Next.js App Router
│ ├── v1/ # Public API (non-standard location - NOT under app/api/)
│ │ ├── chat/completions/ # OpenAI-compatible chat completions
│ │ ├── models/ # Model listing endpoint (excludes Gemini)
│ │ └── messages/ # Anthropic-compatible messages API
│ ├── v1beta/ # Gemini native API endpoints (Google standard paths)
│ │ └── models/ # Gemini API: models listing + generateContent/streamGenerateContent
│ │ ├── route.ts # GET - List models
│ │ └── [...action]/ # POST - generateContent/streamGenerateContent
│ ├── api/admin/ # Admin API endpoints — [AGENTS.md]
│ │ ├── kv/ # KV namespace management
│ │ │ ├── [namespace]/ # KV operations
│ │ │ ├── [namespace]/[key]/ # Single key operations
│ │ │ ├── [namespace]/batch/ # Batch operations
│ │ │ └── [namespace]/import/ # Import operations
│ │ ├── r2/ # R2 bucket management
│ │ │ ├── [bucket]/ # Bucket operations
│ │ │ └── [bucket]/[key]/ # Object operations
│ │ ├── tables/ # D1 table management
│ │ │ ├── [table]/ # Table operations
│ │ │ ├── [table]/rows/ # Row operations
│ │ │ └── [table]/batch/ # Batch row operations
│ │ ├── download/history/ # Download history
│ │ └── analytics/ # Cloudflare Analytics Engine API
│ ├── admin/ # Admin UI (React + Ant Design)
│ │ ├── kv/ # KV management UI
│ │ ├── r2/ # R2 storage management UI
│ │ ├── download/ # Download proxy management
│ │ ├── chat/ # Chat test interface
│ │ ├── api-test/ # API testing interface
│ │ ├── analytics/ # API usage analytics
│ │ └── components/ # Shared admin components
│ ├── api/download/ # Download proxy endpoint
│ ├── api/gh/ # GitHub file proxy endpoint
│ ├── components/ # React components
│ │ └── Chat/ # Chat UI components
│ └── lib/ # Client-side utilities
├── src/
│ ├── protocols/ # Protocol adapters (OpenAI, Anthropic, Google, Gemini CLI) — [AGENTS.md]
│ ├── managers/ # KeyManager (KV/D1 token management)
│ ├── config/ # ConfigManager, provider configs
│ ├── utils/ # Logger, CORS constants, SSRF protection
│ ├── lib/ # Auth middleware, response helpers
│ └── types/ # Protocol, request, response, R2 types
├── test/ # Vitest + Cloudflare Workers pool
│ ├── unit/ # Protocol + manager tests
│ └── factories/ # Mock data generators
├── prisma/migrations/ # D1 schema migrations
├── wrangler.jsonc # Cloudflare Workers config (D1, KV, R2, secrets)
└── vitest.config.mts # Test config with CF pool
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new protocol adapter | `src/protocols/` | Implement `ProtocolAdapter` interface, export factory |
| Add new public API route | `app/v1/` | Non-standard: v1 routes are NOT under `app/api/` |
| Add Gemini native route | `app/v1beta/` | Gemini native format endpoints (standard Google REST paths) |
| Add Gemini content generation | `app/v1beta/models/[...action]/` | Catch-all for :generateContent/:streamGenerateContent |
| Add admin API endpoint | `app/api/admin/` | Follow existing CRUD patterns |
| Modify auth logic | `src/lib/auth.ts` | `authenticate()` function |
| Add provider config | `src/config/default.ts` | Add to `providers` object |
| Type definitions | `src/types/` | All types in barrel export |
| Public API endpoints | `app/v1/` | Chat completions, models, messages |
| Gemini native endpoints | `app/v1beta/` | Standard Google Gemini REST paths (`models/{model}:generateContent`) |
| Admin UI pages | `app/admin/` | React + Ant Design components |
| API testing UI | `app/admin/api-test/` | Interactive API testing interface |
| Analytics API | `app/api/admin/analytics/` | Cloudflare Analytics Engine queries |
| Analytics UI | `app/admin/analytics/` | Charts with Recharts |
| KV/D1/R2 bindings | `wrangler.jsonc` | PLAYBOX_KV, PLAYBOX_D1, PLAYBOX_R2 |
| R2 operations | `app/api/admin/r2/` | List, upload, download, delete objects |
| R2 UI | `app/admin/r2/` | Object browser with prefix navigation |
| Test factories | `test/factories/` | Mock env, requests, providers |
| SSRF protection | `src/utils/ssrf-protection.ts` | `validateSafeUrl()` function |
| Download proxy | `app/api/download/route.ts` | File download with SSRF protection |
| GitHub proxy | `app/api/gh/[...path]/route.ts` | GitHub file proxy with jsDelivr CDN support |
| GitHub proxy utils | `src/utils/gh-proxy.ts` | URL matching and rewriting |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `ProtocolFactory` | class | `src/protocols/index.ts` | Protocol adapter factory |
| `KeyManager` | object | `src/managers/key.ts` | Token refresh, API key management |
| `ConfigManager` | object | `src/config/index.ts` | Config resolution |
| `authenticate` | function | `src/lib/auth.ts` | API key verification |
| `CORS_HEADERS` | const | `src/utils/constants.ts` | CORS header map |

## CONVENTIONS

- **Barrel exports**: Every subdirectory has `index.ts` for clean imports
- **Protocol pattern**: Each protocol adapter exports `createXProtocol()` factory function
- **Next.js App Router**: Routes use file-based routing with `route.ts`
- **Type-first**: All types in `src/types/`, imported via barrel exports
- **Response helpers**: Use `createXResponse()` functions from `lib/response-helpers.ts`
- **Middleware pattern**: Higher-order functions for auth, CORS, error handling

## ANTI-PATTERNS (THIS PROJECT)

- **DO NOT** use `src/index.ts` — that's a simple example, unused in Next.js version
- **DO NOT** put public API routes under `app/api/` — they belong in `app/v1/`
- **DO NOT** hardcode API keys — use `wrangler.jsonc` vars or secrets
- **DO NOT** skip token caching — Gemini CLI tokens must be cached in KV with TTL
- **DO NOT** modify `worker-configuration.d.ts` manually — run `npm run cf-typegen`
- **DO NOT** skip SSRF validation — all external URLs must use `validateSafeUrl()`
- **DO NOT** create inline mock objects in tests — use factories from `test/factories/`
- **DO NOT** expose secrets in `wrangler.jsonc` — use `wrangler secret put` for sensitive values
- **DO NOT** use server components in admin UI — requires `'use client'` directive
- **DO NOT** forget CORS headers — use response helpers or spread `CORS_HEADERS`

## UNIQUE STYLES

- **Multi-protocol**: Supports OpenAI, Anthropic, Google, Gemini CLI formats
- **KV caching**: Access tokens cached in PLAYBOX_KV with automatic refresh
- **R2 storage**: Object storage via PLAYBOX_R2 bucket binding
- **CORS headers**: All responses include CORS headers from `utils/constants.ts`
- **OpenNext for Cloudflare**: Uses `@opennextjs/cloudflare` for deployment (NOT `@cloudflare/next-on-pages`)
- **Dynamic rendering**: API routes use `export const dynamic = 'force-dynamic'`
- **Ant Design**: Admin UI uses Ant Design components
- **Recharts**: Analytics dashboard uses Recharts for visualizations
- **Analytics Engine**: Cloudflare Analytics Engine for API usage tracking
- **GitHub proxy**: Proxies GitHub file downloads with optional jsDelivr CDN rewriting

## COMMANDS

```bash
npm run dev # Start local dev server (next dev)
npm run build # Build Next.js app
npm run deploy # Deploy to Cloudflare (opennextjs-cloudflare build + deploy)
npm run cf-typegen # Regenerate worker types from wrangler.jsonc
npm test # Run Vitest tests
```

## NOTES

- **Compatibility flags**: `nodejs_compat`, `global_fetch_strictly_public`
- **Observability**: Enabled in wrangler.jsonc (logs + traces)
- **API key**: Must be set via `AUTH_TOKEN` environment variable (no default)
- **Gemini CLI**: Requires OAuth refresh token, auto-refreshes access token
- **Non-standard API paths**: Public API at `app/v1/` (not `app/api/v1/`)
- **Gemini standard paths**: `/v1beta/models/{model}:generateContent` and `/v1beta/models/{model}:streamGenerateContent`
- **Admin routes**: Admin API at `app/api/admin/`, UI at `app/admin/`
- **Prettier config**: 140 char width, single quotes, tabs
- **Test coverage**: 70% branches, 85% functions, 80% lines (enforced)
- **SSRF protection**: Blocks private IPs, link-local, multicast, and blocked TLDs (.local, .internal, .localhost)
- **D1 schema**: Managed via prisma/migrations/
- **Cloudflare context**: Use `getCloudflareContext()` from `@opennextjs/cloudflare`
- **Analytics**: Requires `ANALYTICS_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets
- **GitHub proxy**: Configured via `GH_PROXY_JSD_ENABLE` env var (0=disabled, 1=jsDelivr CDN) — **NOTE: Route not implemented**

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
