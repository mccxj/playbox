# Playbox — AI API Gateway & Protocol Converter

Multi-protocol AI gateway that translates between OpenAI, Anthropic, Google, and Gemini CLI formats. Built on Next.js 15
with Cloudflare Workers deployment.

## Overview

Playbox provides a unified API endpoint to interact with multiple AI providers. It handles protocol conversion,
authentication, token management, and multi-platform deployment (Cloudflare Workers / Vercel).

**Protocols:** OpenAI ↔ Anthropic ↔ Google ↔ Gemini CLI  
**Deployment:** Cloudflare Workers (OpenNext), Vercel, or local dev

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 15 (App Router)                             |
| Language     | TypeScript (strict mode, ES2024)                    |
| Testing      | Vitest + Cloudflare Workers pool + Playwright (E2E) |
| Deployment   | Cloudflare Workers via OpenNext                     |
| Database     | Cloudflare D1 (native + REST API)                   |
| Admin UI     | Ant Design + Recharts                               |
| Code Quality | ESLint flat config + Prettier (140 width)           |

## Features

- **Multi-protocol** — OpenAI, Anthropic, Google, Gemini CLI via single endpoint
- **Protocol conversion** — automatic format translation between providers
- **Gemini native API** — standard Google REST paths (`/v1beta/models/{model}:generateContent`)
- **Multi-platform DB** — SqlClient abstraction: D1 (Workers) / D1 REST API (Vercel)
- **Admin dashboard** — Ant Design UI for provider, key, domain, and data management
- **GitHub Gists management** — CRUD and sync from admin UI
- **Provider speed test** — latency benchmarking from admin panel
- **SSRF protection** — validates all external URLs, blocks private/internal IPs
- **OAuth token management** — auto-refresh with KV caching for Gemini CLI
- **CORS support** — configurable headers on all responses

## Project Structure

```
./
├── app/                          # Next.js App Router
│   ├── v1/                       # Public API (non-standard — NOT under app/api/)
│   │   ├── chat/completions/     #   OpenAI-compatible chat completions
│   │   ├── embeddings/           #   OpenAI-compatible embeddings
│   │   ├── messages/             #   Anthropic-compatible messages
│   │   ├── rerank/               #   Rerank API
│   │   └── models/               #   Model listing (excludes Gemini)
│   ├── v1beta/                   # Gemini native API (Google standard paths)
│   │   └── models/               #   Models listing + generateContent/streamGenerateContent
│   ├── api/admin/                # Admin API endpoints
│   │   ├── tables/               #   D1 table CRUD with batch/rows
│   │   ├── llm-keys/             #   LLM API key management
│   │   ├── providers/            #   Provider config + speed test + models
│   │   ├── domains/              #   Domain management
│   │   └── github-gists/         #   GitHub Gists management
│   ├── admin/                    # Admin UI (React + Ant Design)
│   │   ├── llm-keys/             #   Key management
│   │   ├── providers/            #   Provider config + speed test
│   │   ├── domains/              #   Domain management
│   │   ├── github-gists/         #   Gists management
│   │   └── components/           #   Shared widgets (DataTable, modals, etc.)
│   └── components/               # App-level React components
├── src/                          # Core source
│   ├── protocols/                # Protocol adapters (OpenAI, Anthropic, Google, Gemini CLI)
│   ├── managers/                 # AuthManager + KeyManager
│   ├── db/                       # SqlClient abstraction: D1Adapter + D1RestAdapter
│   ├── config/                   # ConfigManager + provider config resolution
│   ├── platforms/                # Platform detection (CF/Vercel/Node)
│   ├── lib/                      # Auth middleware + response helpers
│   ├── utils/                    # Logger, CORS, SSRF protection, SSE parser
│   └── types/                    # Protocol, request, response type definitions
├── test/                         # Vitest + Cloudflare Workers pool
│   ├── unit/                     #   Protocol + manager + lib + config + db + utils tests
│   ├── e2e/                      #   Playwright end-to-end admin tests
│   └── factories/                #   Mock data generators (createMockEnv, etc.)
├── prisma/migrations/            # D1 schema (6 tables)
├── scripts/
│   └── smoke-test.mjs            # Multi-protocol smoke test
├── wrangler.jsonc                # Cloudflare Workers config (D1, KV, secrets)
└── vitest.config.mts             # Test config (70% branch / 85% func / 80% line coverage)
```

## Quick Start

```bash
# Install
npm install

# Local dev
npm run dev                       # → http://localhost:3000

# Tests
npm test                          # Vitest (CF Workers pool)
npm test -- --coverage            # With coverage report

# Type generation
npm run cf-typegen                # Sync worker-configuration.d.ts from wrangler.jsonc

# Deploy
npm run deploy                    # OpenNext → Cloudflare Workers
```

## API Endpoints

### Public API

| Method | Path                   | Description                   |
| ------ | ---------------------- | ----------------------------- |
| GET    | `/v1/models`           | List models (excl. Gemini)    |
| POST   | `/v1/chat/completions` | OpenAI-compatible chat        |
| POST   | `/v1/embeddings`       | OpenAI-compatible embeddings  |
| POST   | `/v1/messages`         | Anthropic-compatible messages |
| POST   | `/v1/rerank`           | Rerank API                    |

### Gemini Native API

| Method | Path                                           | Description              |
| ------ | ---------------------------------------------- | ------------------------ |
| GET    | `/v1beta/models`                               | List Gemini models       |
| POST   | `/v1beta/models/{model}:generateContent`       | Generate (non-streaming) |
| POST   | `/v1beta/models/{model}:streamGenerateContent` | Generate (streaming SSE) |

### Admin API

| Method | Path                                  | Description              |
| ------ | ------------------------------------- | ------------------------ |
| GET    | `/api/admin/tables`                   | List D1 tables + schemas |
| GET    | `/api/admin/tables/{table}/rows`      | List table rows          |
| POST   | `/api/admin/tables/{table}/rows`      | Create row               |
| GET    | `/api/admin/tables/{table}/rows/{id}` | Get row                  |
| PUT    | `/api/admin/tables/{table}/rows/{id}` | Update row               |
| DELETE | `/api/admin/tables/{table}/rows/{id}` | Delete row               |
| POST   | `/api/admin/tables/{table}/batch`     | Batch delete / import    |
| GET    | `/api/admin/llm-keys`                 | List LLM API keys        |
| POST   | `/api/admin/llm-keys`                 | Create LLM API key       |
| GET    | `/api/admin/providers`                | List providers           |
| POST   | `/api/admin/providers/speed-test`     | Run provider speed test  |
| GET    | `/api/admin/providers/models`         | List provider models     |
| GET    | `/api/admin/domains`                  | List domains             |
| GET    | `/api/admin/github-gists`             | List GitHub Gists        |
| POST   | `/api/admin/github-gists`             | Create / sync gist       |

**Auth:** All endpoints require one of: `Authorization: Bearer <token>`, `x-api-key`, `x-goog-api-key`, or `?key=`
param.

## Development

### Adding a Protocol

1. Create `<name>.ts` in `src/protocols/`
2. Implement `ProtocolAdapter` interface (from `types.ts`)
3. Export `create<Name>Protocol()` factory
4. Register in `src/protocols/index.ts`

### Route Placement

| Route Type    | Location         |
| ------------- | ---------------- |
| Public API    | `app/v1/`        |
| Gemini native | `app/v1beta/`    |
| Admin API     | `app/api/admin/` |

### Database

Business code depends on `SqlClient` interface (`src/db/types.ts`), never concrete adapters:

- **Cloudflare Workers** — `D1Adapter` (native D1 binding)
- **Vercel / other** — `D1RestAdapter` (Cloudflare REST API with Bearer token)
- **Factory** — `createSqlClient(options)` picks adapter automatically

## Configuration

Config source: D1 `providers` table (no local fallback files). Manage via admin UI or direct D1 queries.

```bash
# Required secrets
wrangler secret put AUTH_TOKEN
wrangler secret put CLOUDFLARE_API_TOKEN    # D1 REST API (Vercel)

# Local development
cp .dev.vars.example .dev.vars
```

## Code Quality

| Check      | Tool                     | Thresholds                                     |
| ---------- | ------------------------ | ---------------------------------------------- |
| Linting    | ESLint (flat config)     | TypeScript-ESLint + React rules                |
| Formatting | Prettier                 | 140 width, single quotes, 2-space tabs         |
| Unit tests | Vitest (CF Workers pool) | 70% branches / 85% functions / 80% lines       |
| E2E tests  | Playwright               | Admin dashboard flow                           |
| SSRF       | `validateSafeUrl()`      | Blocks private IPs, `.local`, `.internal` TLDs |

## Documentation

- [AGENTS.md](./AGENTS.md) — project knowledge base for AI agents
- [DESIGN.md](./DESIGN.md) — design tokens and UI patterns (colors, typography, spacing, components)

## License

MIT
