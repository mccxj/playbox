# Admin UI

**Location:** `app/admin/`

## OVERVIEW

Admin interface for D1 database, KV storage, download management, chat testing, and analytics with Ant Design components
and Recharts visualizations.

## STRUCTURE

```
admin/
├── layout.tsx # Shared layout (Sider, Header, Content)
├── page.tsx # D1 Tables page (default)
├── components/ # Shared admin components
├── kv/ # KV namespace management
├── r2/ # R2 storage management
├── download/ # Download proxy management
│   ├── page.tsx # Main download page
│   ├── types.ts # Download interfaces
│   ├── components/ # DownloadList, DownloadStats, DownloadModal
│   └── hooks/ # useDownloads custom hook
├── chat/ # Chat test interface
│   └── page.tsx # Chat testing page
├── api-test/ # API testing interface
│   └── page.tsx # Interactive API test page
├── analytics/ # API usage analytics
│   └── page.tsx # Analytics dashboard with charts
├── llm-keys/ # LLM API key management
│   └── page.tsx # Key management page
├── short-url/ # Short URL management
│   └── page.tsx # Short URL management page
├── providers/ # AI provider configuration
│   └── page.tsx # Provider config page
├── domains/ # Domain management
│   └── page.tsx # Domain management page
├── email/ # Email configuration
│   └── page.tsx # Email settings page
├── langextract/ # Language extraction
│   └── page.tsx # Language extraction UI
└── types.ts # Shared admin types
```

## WHERE TO LOOK

| Task                 | Location                         | Notes                                                |
| -------------------- | -------------------------------- | ---------------------------------------------------- |
| Add menu item        | `layout.tsx`                     | Menu items array                                     |
| Add new admin page   | Create dir + `page.tsx`          | Follow existing patterns                             |
| Chat test page       | `chat/page.tsx`                  | Chat interface with model selector                   |
| Analytics dashboard  | `analytics/page.tsx`             | Charts with Recharts (PieChart, BarChart, LineChart) |
| Download components  | `download/components/`           | DownloadList, DownloadStats, DownloadModal           |
| Download hook        | `download/hooks/useDownloads.ts` | State management for downloads                       |
| Shared components    | `components/`                    | Reusable admin widgets                               |
| API test page        | `api-test/page.tsx`              | Interactive API testing with history                 |
| LLM key management   | `llm-keys/page.tsx`              | LLM API key CRUD                                     |
| Short URL management | `short-url/page.tsx`             | Short URL CRUD                                       |
| Provider config      | `providers/page.tsx`             | Provider configuration + speed test                  |
| Domain management    | `domains/page.tsx`               | Domain CRUD                                          |
| Email settings       | `email/page.tsx`                 | Email configuration                                  |
| R2 management        | `r2/page.tsx`                    | Object browser with prefix navigation                |
| KV management        | `kv/page.tsx`                    | KV namespace management                              |
| LangExtract          | `langextract/page.tsx`           | Language extraction UI                               |

## CONVENTIONS

- **Ant Design**: All UI uses Ant Design components
- **Recharts**: Analytics page uses Recharts for visualizations
- **Custom hooks**: State management via hooks in subdirectories

## ANTI-PATTERNS

- **DO NOT** use server components — admin pages must be client-side
- **DO NOT** duplicate layout — use shared `layout.tsx`
