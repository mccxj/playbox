# React Components

**Location:** `app/components/`

## OVERVIEW

Shared React components for Chat and Admin interfaces. Chat components implement real-time chat UI with model selection
and API key management.

## STRUCTURE

```
components/
└── Chat/
    ├── ChatInput.tsx # Message input with send button
    ├── ChatMessage.tsx # Message display (user/assistant)
    ├── ChatHistorySidebar.tsx # Conversation history
    ├── ModelSelector.tsx # Model dropdown selector
    └── ApiKeyModal.tsx # API key input modal
```

## WHERE TO LOOK

| Task                 | Location                      | Notes                    |
| -------------------- | ----------------------------- | ------------------------ |
| Modify chat input    | `Chat/ChatInput.tsx`          | Input field + send logic |
| Change message style | `Chat/ChatMessage.tsx`        | User/assistant rendering |
| Add history feature  | `Chat/ChatHistorySidebar.tsx` | Sidebar navigation       |
| Add new model        | `Chat/ModelSelector.tsx`      | Model dropdown options   |
| API key handling     | `Chat/ApiKeyModal.tsx`        | Modal for key input      |

## CONVENTIONS

- **State management**: Local useState, no global state
- **API integration**: Calls `/api/v1/chat/completions` endpoint

## ANTI-PATTERNS

- **DO NOT** duplicate API key logic — use shared modal pattern
