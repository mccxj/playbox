# Protocol Adapters

## OVERVIEW

Protocol adapter implementations converting between AI provider formats (OpenAI, Anthropic, Google, Gemini CLI) and
internal standard format.

## STRUCTURE

```
protocols/
├── index.ts         # ProtocolFactory + barrel exports
├── types.ts         # ProtocolAdapter interface + core types
├── openai.ts        # OpenAI format (Bearer auth, /v1/chat/completions)
├── anthropic.ts     # Anthropic format (x-api-key/Bearer, SSE streaming conversion)
├── google.ts        # Google AI format (x-goog-api-key header, action-based URLs)
└── gemini-cli.ts    # Gemini CLI OAuth (KV token caching, auto-refresh)
```

## WHERE TO LOOK

| Task                 | Location                                            | Notes                                               |
| -------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Add new protocol     | Create `<name>.ts` + export factory from `index.ts` | Implement `ProtocolAdapter` interface               |
| Modify OAuth logic   | `gemini-cli.ts`                                     | Uses `KeyManager.getValidAccessToken()`             |
| Check interface      | `types.ts`                                          | `ProtocolAdapter` defines required/optional methods |
| Streaming conversion | `anthropic.ts`                                      | Only adapter with full SSE ↔ SSE conversion         |

## CONVENTIONS

- **Factory exports**: Each protocol exports `createXProtocol()` function
- **Identity transforms**: Protocols without conversion use `identityTransforms` from `index.ts`
- **Method defaults**: Only `getApiKey`, `getEndpoint`, `getHeaders` required; conversion methods optional

## ANTI-PATTERNS

- **DO NOT** mix protocol formats — each adapter handles one format only
- **DO NOT** skip OAuth refresh for Gemini CLI — access tokens expire
- **DO NOT** hardcode base URLs — use `provider.endpoint` from config
- **DO NOT** implement conversion methods unnecessarily — most adapters are pass-through
