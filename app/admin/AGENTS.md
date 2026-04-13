# Admin UI

**Location:** `app/admin/`

## OVERVIEW

Admin interface for D1 database, KV storage, download management, chat testing, and analytics with Ant Design components and Recharts visualizations.

## STRUCTURE

```
admin/
├── layout.tsx # Shared layout (Sider, Header, Content)
├── components/ # Shared admin components
├── kv/ # KV namespace management
├── download/ # Download proxy management (page + components + hooks)
├── chat/ # Chat test interface
└── analytics/ # Analytics dashboard with Recharts
```
admin/
├── layout.tsx # Shared layout (Sider, Header, Content)
├── components/ # Shared admin components
├── kv/ # KV namespace management
├── download/ # Download proxy management (page + components + hooks)
├── chat/ # Chat test interface
└── analytics/ # Analytics dashboard with Recharts
```
admin/
├── layout.tsx # Shared layout (Sider, Header, Content)
├── page.tsx # D1 Tables page (default)
├── components/ # Shared admin components
├── kv/ # KV namespace management
├── download/ # Download proxy management
│ ├── page.tsx # Main download page
│ ├── types.ts # Download interfaces
│ ├── components/ # DownloadList, DownloadStats, DownloadModal
│ └── hooks/ # useDownloads custom hook
├── chat/ # Chat test interface
│ └── page.tsx # Chat testing page
├── analytics/ # API usage analytics
│ └── page.tsx # Analytics dashboard with charts
└── types.ts # Shared admin types
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add menu item | `layout.tsx:18-34` | Menu items array |
| Add new admin page | Create dir + `page.tsx` | Follow existing patterns |
| Chat test page | `chat/page.tsx` | Chat interface with model selector |
| Analytics dashboard | `analytics/page.tsx` | Charts with Recharts (PieChart, BarChart, LineChart) |
| Download components | `download/components/` | DownloadList, DownloadStats, DownloadModal |
| Download hook | `download/hooks/useDownloads.ts` | State management for downloads |
| Shared components | `components/` | Reusable admin widgets |

## CONVENTIONS

- **Ant Design**: All UI uses Ant Design components
- **Recharts**: Analytics page uses Recharts for visualizations
- **Custom hooks**: State management via hooks in subdirectories

## ANTI-PATTERNS

- **DO NOT** use server components — admin pages must be client-side
- **DO NOT** duplicate layout — use shared `layout.tsx`
