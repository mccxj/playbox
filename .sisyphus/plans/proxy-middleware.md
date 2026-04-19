# HTTP/HTTPS Forward Proxy Middleware — Implementation Plan

## Goal

Add an HTTP/HTTPS forward proxy to the Cloudflare Workers deployment that:

- Handles HTTP proxy requests (client sends full URL, proxy fetches and returns)
- Handles HTTPS CONNECT tunneling via `cloudflare:sockets` connect() API
- Authenticates proxy users via Proxy-Authorization (Basic auth)
- Supports domain whitelist/blacklist via env vars
- Reuses SSRF protection for target validation
- Intercepts proxy requests before Next.js handler via custom worker wrapper

## Architecture

### Custom Worker Wrapper (`worker.ts`)

- Imports `handler` from `.open-next/worker.js`
- Re-exports Durable Object bindings (DOQueueHandler, DOShardedTagCache)
- In `fetch()`: checks if request is a proxy request → handles it, else passes to Next.js handler
- Proxy detection: request method is CONNECT, OR request URL is absolute (not relative path)

### Proxy Handler (`src/proxy/`)

```
src/proxy/
├── index.ts           # Barrel exports
├── handler.ts         # Main proxy dispatcher
├── http-proxy.ts      # HTTP forward proxy (fetch & relay)
├── connect-proxy.ts   # HTTPS CONNECT tunnel via cloudflare:sockets
├── auth.ts            # Proxy-Authorization Basic auth
├── domain-filter.ts   # Whitelist/blacklist domain filtering
└── types.ts           # Proxy-specific types
```

### Proxy Request Detection

A request is a proxy request if:

1. Method is `CONNECT` (HTTPS proxy tunnel)
2. Request URL is an absolute URL with scheme (e.g., `http://example.com/path`) — HTTP proxy

Regular Next.js requests have relative URLs (e.g., `/v1/chat/completions`).

### HTTP Proxy Flow

1. Detect absolute URL in request → proxy mode
2. Authenticate via Proxy-Authorization header
3. Validate target URL with SSRF protection
4. Check domain filter
5. Forward request via `fetch()` to target, streaming response back
6. Strip hop-by-hop headers (Proxy-\*, Connection, etc.)

### CONNECT Proxy Flow

1. Detect CONNECT method → tunnel mode
2. Authenticate via Proxy-Authorization header
3. Parse target host:port from request URL
4. Validate hostname with SSRF protection (check against private IPs)
5. Check domain filter
6. Open TCP connection via `connect()` from `cloudflare:sockets`
7. Return 200 Connection Established
8. Relay data bidirectionally:
   - Pipe request body → socket.writable
   - Return Response with body = socket.readable

### Authentication

- Header: `Proxy-Authorization: Basic <base64(user:pass)>`
- Env vars: `PROXY_USER` and `PROXY_PASS`
- If PROXY_USER is not set, proxy is disabled (returns 407)

### Domain Filtering

- `PROXY_DOMAIN_MODE`: "off" | "whitelist" | "blacklist" (default: "off")
- `PROXY_DOMAIN_LIST`: comma-separated domain list (e.g., "example.com,api.github.com")
- Subdomain matching: if "example.com" is in whitelist, "sub.example.com" is also allowed

### SSRF Protection

- HTTP: reuse existing `validateSafeUrl()` from `src/utils/ssrf-protection.ts`
- CONNECT: validate hostname against private IP ranges, blocked domains, blocked TLDs
  - Extract hostname validation logic into reusable `validateSafeHostname()` function

## Files to Create/Modify

### New Files

1. `worker.ts` — Custom worker wrapper
2. `src/proxy/index.ts` — Barrel exports
3. `src/proxy/handler.ts` — Main proxy dispatcher
4. `src/proxy/http-proxy.ts` — HTTP forward proxy
5. `src/proxy/connect-proxy.ts` — CONNECT tunnel
6. `src/proxy/auth.ts` — Proxy authentication
7. `src/proxy/domain-filter.ts` — Domain filtering
8. `src/proxy/types.ts` — Proxy types
9. `src/utils/ssrf-protection.ts` — Add `validateSafeHostname()`
10. `test/unit/proxy/handler.test.ts` — Handler tests
11. `test/unit/proxy/http-proxy.test.ts` — HTTP proxy tests
12. `test/unit/proxy/connect-proxy.test.ts` — CONNECT tunnel tests
13. `test/unit/proxy/auth.test.ts` — Auth tests
14. `test/unit/proxy/domain-filter.test.ts` — Domain filter tests

### Modified Files

1. `wrangler.jsonc` — Change `main` from `.open-next/worker.js` to `worker.ts`, add PROXY\_\* vars
2. `wrangler.test.jsonc` — Add PROXY\_\* vars for testing
3. `src/utils/ssrf-protection.ts` — Add `validateSafeHostname()` export
4. `test/factories/index.ts` — Add proxy-related mock env vars
5. `test/setup.ts` — Add proxy env vars to globalThis.env

## Implementation Order

1. `src/proxy/types.ts` — Type definitions
2. `src/proxy/auth.ts` — Proxy authentication (no dependencies)
3. `src/proxy/domain-filter.ts` — Domain filtering (no dependencies)
4. `src/utils/ssrf-protection.ts` — Add `validateSafeHostname()`
5. `src/proxy/http-proxy.ts` — HTTP proxy handler
6. `src/proxy/connect-proxy.ts` — CONNECT tunnel handler
7. `src/proxy/handler.ts` — Main dispatcher
8. `src/proxy/index.ts` — Barrel exports
9. `worker.ts` — Custom worker wrapper
10. `wrangler.jsonc` + `wrangler.test.jsonc` — Config updates
11. `test/factories/index.ts` + `test/setup.ts` — Test infrastructure
12. All test files
13. Run tests, verify coverage

## Verification

- All proxy unit tests pass
- Coverage thresholds met (70% branches, 85% functions, 80% lines)
- LSP diagnostics clean on new files
- `npm run build` succeeds (worker.ts compiles)
