# Configuration Management

**Location:** `src/config/`

## OVERVIEW

Provider configuration and runtime config resolution. Manages AI provider endpoints, model lists, and provider-type
mapping.

## STRUCTURE

```
config/
├── index.ts     # ConfigManager + resolveProvider()
└── default.ts   # DEFAULT_CONFIG with provider definitions
```

## WHERE TO LOOK

| Task                    | Location        | Notes                        |
| ----------------------- | --------------- | ---------------------------- |
| Add new provider        | `default.ts`    | Add to `providers` object    |
| Change default provider | `default.ts:83` | `default_provider` field     |
| Modify resolution logic | `index.ts:12`   | `resolveProvider()` function |
| Config interface        | `default.ts:7`  | `Config` type definition     |

## CONVENTIONS

- **Provider types**: `openai`, `anthropic`, `google`, `gemini-cli`
- **Model matching**: First match wins, prefers `preferredType` if specified
- **Fallback**: Uses `default_provider` if model not found
- **Env override**: `API_CONFIG` env var overrides DEFAULT_CONFIG

## ANTI-PATTERNS

- **DO NOT** hardcode endpoints in route handlers — use `getConfig()`
- **DO NOT** skip model validation — `resolveProvider()` handles fallback

## NOTES

- **Providers**: longcat, cerebras, gemini, modelscope, nvidia
- **Key resolution**: Provider key names map to env vars (e.g., `LongCat` → `LONGCAT_API_KEY`)
