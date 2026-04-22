# Utilities

**Location:** `src/utils/`

## OVERVIEW

Shared utility functions for logging, SSE parsing, and SSRF protection. Used across protocol adapters and API routes.

## STRUCTURE

```
utils/
├── index.ts # Barrel exports
├── logger.ts # Request-scoped logging with reqId
├── sse-parser.ts # Server-Sent Events stream parser
├── ssrf-protection.ts # URL validation for external requests
└── constants.ts # CORS headers map
```

## WHERE TO LOOK

| Task                   | Location             | Notes                                  |
| ---------------------- | -------------------- | -------------------------------------- |
| Add logging            | `logger.ts`          | `Logger.create()` with reqId           |
| Parse SSE streams      | `sse-parser.ts`      | Used by protocol adapters              |
| Validate external URLs | `ssrf-protection.ts` | `validateSafeUrl()` blocks private IPs |
| CORS headers           | `constants.ts`       | `CORS_HEADERS` constant                |

## CONVENTIONS

- **Barrel exports**: All utilities exported via `index.ts`
- **Request-scoped logging**: `Logger.create(reqId)` for traceable logs
- **SSRF protection**: ALL external URLs must use `validateSafeUrl()`

## ANTI-PATTERNS

- **DO NOT** skip SSRF validation on external URLs
- **DO NOT** hardcode CORS headers — use `CORS_HEADERS` constant
- **DO NOT** create logger without reqId — use `Logger.create()`

## UNIQUE STYLES

- **SSRF protection**: Blocks private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local,
  multicast, and blocked TLDs (.local, .internal, .localhost)
- **Async validation**: `validateSafeUrlAsync()` for non-blocking URL checks

## NOTES

- **Logger levels**: info, warn, error
- **SSRF blocked TLDs**: .local, .internal, .localhost
- **CORS constant**: Used by all API responses
