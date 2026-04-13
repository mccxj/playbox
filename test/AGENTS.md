# Test Suite

**Location:** `test/`

## OVERVIEW

Vitest tests with Cloudflare Workers pool. Uses global mocking for KV/D1 bindings and factory-based test data generation.

## STRUCTURE

```
test/
├── setup.ts # Global mocks: KV, D1, node-fetch
├── factories/
│   └── index.ts # Mock data generators
└── unit/
    ├── protocols/ # Protocol adapter tests
    └── managers/ # Manager tests
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add protocol test | `unit/protocols/` | Follow existing pattern |
| Add manager test | `unit/managers/` | Use factories for mock data |
| Mock data factories | `factories/index.ts` | `createMockEnv`, `createMockProviderConfig` |
| Global setup | `setup.ts` | KV/D1 mocks, fetch interception |
| Coverage thresholds | `vitest.config.mts` | 70% branches, 85% functions |

## CONVENTIONS

- **Cloudflare Workers pool**: Uses `@cloudflare/vitest-pool-workers`
- **Factory pattern**: All test data via `test/factories/` with overrides
- **Global mocks**: KV/D1 pre-mocked in `setup.ts`, not per-test

## ANTI-PATTERNS

- **DO NOT** create inline mock objects — use factories
- **DO NOT** mock fetch per-test — global mock in setup.ts handles it
