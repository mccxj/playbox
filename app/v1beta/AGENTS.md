# Gemini Native API Routes (V1beta)

**Location:** `app/v1beta/`

## OVERVIEW

Gemini native format API endpoints following Google's official REST API paths. Returns models and handles content generation in Google's native Gemini format (not OpenAI-compatible).

## STRUCTURE

```
v1beta/
└── models/
    ├── route.ts           # GET - List models
    └── [...action]/       # POST - generateContent/streamGenerateContent (catch-all)
        └── route.ts       # Handles :generateContent and :streamGenerateContent
```

## ENDPOINTS

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1beta/models` | List available Gemini models |
| POST | `/v1beta/models/{model}:generateContent` | Generate content (non-streaming) |
| POST | `/v1beta/models/{model}:streamGenerateContent` | Generate content (streaming SSE) |

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| List Gemini models | `models/route.ts` | Returns Gemini-native format |
| Generate content | `models/[...action]/route.ts` | Catch-all for :generateContent/:streamGenerateContent |
| Stream content | `models/[...action]/route.ts` | Same route, action=`streamGenerateContent` |

## CONVENTIONS

- **Location**: `app/v1beta/` (mirrors Google's API versioning)
- **Standard paths**: Follows Google Gemini REST API format (`models/{model}:generateContent`)
- **Catch-all routing**: `[...action]` captures colon-separated action (Next.js limitation)
- **Dynamic**: `export const dynamic = 'force-dynamic'`
- **Dynamic**: `export const dynamic = 'force-dynamic'`
- **Auth**: `authenticate()` from `@/lib/auth`
- **Format**: Gemini native JSON format (not OpenAI-compatible)

## ANTI-PATTERNS

- **DO NOT** return OpenAI format — use Gemini native format
- **DO NOT** include non-Gemini models — only `family: 'gemini'` providers
- **DO NOT** create separate routes for each action — use catch-all `[...action]`

## NOTES

- **Standard paths**: `/v1beta/models/{model}:generateContent` (Google official format)
- **Catch-all**: Next.js cannot directly route `:` character, so `[...action]` captures the full segment
- **Parsing**: Route parses `{model}:{action}` format internally
- **Supported actions**: `generateContent`, `streamGenerateContent`
- **Gemini models only**: Filters providers with `family === 'gemini'`
