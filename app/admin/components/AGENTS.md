# Shared Admin Components

**Location:** `app/admin/components/`

## OVERVIEW

Reusable Ant Design components for admin UI pages. Data tables, search bars, modals for CRUD operations, and referral
badge.

## STRUCTURE

```
components/
├── DataTable.tsx # Generic paginated data table
├── SearchBar.tsx # Search input with debounce
├── CreateRowModal.tsx # Modal for creating new rows
├── EditRowModal.tsx # Modal for editing existing rows
├── ImportModal.tsx # Modal for bulk import (JSON/CSV)
└── ReferralBadge.tsx # Referral link badge component
```

## WHERE TO LOOK

| Task           | Location             | Notes                            |
| -------------- | -------------------- | -------------------------------- |
| Data table     | `DataTable.tsx`      | Paginated table with sorting     |
| Search         | `SearchBar.tsx`      | Debounced search input           |
| Create modal   | `CreateRowModal.tsx` | Generic create form modal        |
| Edit modal     | `EditRowModal.tsx`   | Generic edit form modal          |
| Import modal   | `ImportModal.tsx`    | Bulk import JSON/CSV             |
| Referral badge | `ReferralBadge.tsx`  | Displays referral link with copy |

## CONVENTIONS

- **Ant Design**: All components use Ant Design (Table, Modal, Form, Input, Button)
- **Generic**: DataTable and modals accept generic `T` type for row data
- **Client components**: All use `'use client'` directive

## ANTI-PATTERNS

- **DO NOT** duplicate table/search logic — use these shared components
- **DO NOT** use server components — these require client-side interactivity
