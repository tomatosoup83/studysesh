# Plan: Community Budget Tracker App

## Context

Add a community budget tracker app to the studysesh monorepo, served at `/budget`. The app must share the existing auth system (same `users` table + JWT), theme/settings system (`settingsStore`), and command palette infrastructure. It features a transaction spreadsheet, weekly spending overview, academic calendar term/week system, budget leaderboard, and spending graphs.

---

## Architecture: Single SPA, Pathname-Based Routing

Both apps are compiled into **one Vite bundle**. `App.tsx` dispatches based on `window.location.pathname`:
- `/study/*` → renders StudySesh
- `/budget/*` → renders BudgetApp

All Zustand stores are automatically shared (same JS context). Cross-app navigation uses `window.location.href` (full page load) to reset non-persisted runtime state.

**Breaking change required:** Vite `base` must change from `/study/` to `/` so assets are at `/assets/...` and can be served at both paths.

---

## Implementation Order

### Phase 0 — Infrastructure (do first, verify StudySesh still works)

**`vite.config.ts`**
- Change `base: '/study/'` → `base: '/'`

**`server/index.ts`**
- Remove `rewriteRequestPath` from `serveStatic` (no longer needed after base change)
- Keep `serveStatic({ root: './dist' })` for `/assets/*`, favicons
- Add explicit SPA fallbacks:
  ```typescript
  app.get('/study/*', (c) => c.html(readFileSync(join(distPath, 'index.html'), 'utf-8')))
  app.get('/budget/*', (c) => c.html(readFileSync(join(distPath, 'index.html'), 'utf-8')))
  app.get('/', (c) => c.redirect('/study'))
  ```
- Append budget route mounts (see Phase 2)

**`src/App.tsx`**
- Rename current `App` function → `StudySeshApp`
- New default export `App`:
  ```typescript
  export default function App() {
    if (window.location.pathname.startsWith('/budget')) return <BudgetApp />
    return <StudySeshApp />
  }
  ```

**`src/hooks/useThemeApplicator.ts`** *(new — extracted from App.tsx lines 63–72)*
- Pull the `useEffect` that sets `data-theme` / inline CSS vars out of `StudySeshApp`
- Both `StudySeshApp` and `BudgetApp` call `useThemeApplicator()`

**`package.json`** — add `recharts` dependency

---

### Phase 1 — Database Schema (`server/db.ts`)

Append after existing tables using `CREATE TABLE IF NOT EXISTS` + `try/catch` migrations:

```sql
-- Budget categories (mirrors subjects table)
budget_categories: id TEXT PK, user_id FK→users CASCADE, name TEXT, color TEXT
INDEX: idx_budget_categories_user ON (user_id)

-- Transactions
budget_transactions: id TEXT PK, user_id FK→users CASCADE, date TEXT 'YYYY-MM-DD',
  name TEXT, amount REAL, category_id FK→budget_categories SET NULL, notes TEXT,
  created_at INTEGER DEFAULT (unixepoch()*1000)
INDEXES: idx_budget_tx_user, idx_budget_tx_user_date ON (user_id, date)

-- Per-user settings
budget_settings: user_id TEXT PK FK→users CASCADE, weekly_limit REAL DEFAULT 0,
  leaderboard_visible INTEGER DEFAULT 1, updated_at INTEGER

-- Academic terms (up to 4 per user)
budget_terms: id TEXT PK, user_id FK→users CASCADE, name TEXT,
  start_date TEXT, end_date TEXT, sort_order INTEGER DEFAULT 0
INDEX: idx_budget_terms_user

-- Holidays
budget_holidays: id TEXT PK, user_id FK→users CASCADE, date TEXT, name TEXT
INDEX: idx_budget_holidays_user
```

---

### Phase 2 — Backend Routes (`server/routes/budget/`)

All routes apply `requireAuth` as first middleware. Mount in `server/index.ts` at `/api/budget/*`.

**`categories.ts`** — mirrors tasks subjects endpoints exactly
- `GET /api/budget/categories` → `{ categories }`. If user has none, seed: Food `#10b981`, Leisure `#818cf8`, Fees `#f87171`
- `POST /api/budget/categories` → body `{ id?, name, color }` → `INSERT OR REPLACE`
- `DELETE /api/budget/categories/:id` → verify ownership, delete

**`transactions.ts`**
- `GET /api/budget/transactions?weekStart=YYYY-MM-DD` → query `date >= weekStart AND date <= weekEnd` (weekEnd = weekStart + 6 days), return `{ transactions, weekStart, weekEnd }`
- `POST /api/budget/transactions` → body `{ id?, date, name, amount, categoryId?, notes? }` → insert, return created row
- `PATCH /api/budget/transactions/:id` → dynamic field map pattern (same as `tasks.ts` PATCH — build `SET` clause from body keys), verify `user_id`
- `DELETE /api/budget/transactions/:id` → verify ownership, delete

**`settings.ts`**
- `GET /api/budget/settings` → `SELECT` or return defaults `{ weeklyLimit: 0, leaderboardVisible: true }`
- `PUT /api/budget/settings` → `INSERT OR REPLACE` with updated values

**`terms.ts`**
- `GET /api/budget/terms` → `{ terms: [...], holidays: [...] }` for user
- `PUT /api/budget/terms` → bulk replace: DELETE all user's terms+holidays, re-INSERT from body `{ terms: [{ name, startDate, endDate, sortOrder }] }`
- `POST /api/budget/holidays` → insert `{ date, name }`
- `DELETE /api/budget/holidays/:id` → verify ownership, delete

**`leaderboard.ts`**
- `GET /api/budget/leaderboard?weekStart=YYYY-MM-DD`
- SQL: JOIN users + budget_settings + LEFT JOIN budget_transactions for the week range
- Filter: `leaderboard_visible = 1 AND weekly_limit > 0`
- Compute in JS: `pctUnderBudget = (weeklyLimit - weeklySpent) / weeklyLimit * 100`
- Sort descending by pctUnderBudget, assign rank 1-indexed
- Return `{ weekStart, weekEnd, entries: [{ rank, displayName, weeklyLimit, weeklySpent, surplus, pctUnderBudget }] }`

---

### Phase 3 — Frontend Types & API Client

**`src/types/api.ts`** — append:
```typescript
BudgetCategoryItem: { id, name, color }
BudgetTransactionItem: { id, date, name, amount, categoryId, notes, createdAt }
BudgetTransactionsResponse: { transactions, weekStart, weekEnd }
BudgetSettingsItem: { weeklyLimit, leaderboardVisible }
BudgetTermItem: { id, name, startDate, endDate, sortOrder }
BudgetHolidayItem: { id, date, name }
BudgetTermsResponse: { terms, holidays }
BudgetLeaderboardEntry: { rank, displayName, weeklyLimit, weeklySpent, surplus, pctUnderBudget }
BudgetLeaderboardResponse: { weekStart, weekEnd, entries }
```

**`src/lib/api.ts`** — add `budget` namespace to `api` object (same `request<T>()` pattern):
- `budget.getCategories()`, `budget.createCategory()`, `budget.deleteCategory()`
- `budget.getTransactions(weekStart)`, `budget.createTransaction()`, `budget.updateTransaction()`, `budget.deleteTransaction()`
- `budget.getSettings()`, `budget.updateSettings()`
- `budget.getTerms()`, `budget.saveTerms()`, `budget.createHoliday()`, `budget.deleteHoliday()`
- `budget.getLeaderboard(weekStart)`

---

### Phase 4 — Frontend Stores (`src/stores/`)

**`budgetCategoryStore.ts`** — persisted as `studysesh-budget-categories`
- `categories: BudgetCategoryItem[]`, `isLoaded: boolean`
- `syncFromServer()`, `addCategory(name, color)` (optimistic + nanoid id), `deleteCategory(id)` (optimistic)
- Rollback pattern on API failure (same as taskStore subjects)

**`budgetTransactionStore.ts`** — NOT persisted (server is source of truth)
- `transactions`, `currentWeekStart: string`, `isLoading`
- `currentWeekStart` initializes to `format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')` via `date-fns`
- `fetchWeek(weekStart)`, `navigateWeek('prev'|'next')`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()`

**`budgetSettingsStore.ts`** — NOT persisted
- `weeklyLimit, leaderboardVisible, terms, holidays, isLoaded`
- `syncFromServer()` — fetches `/api/budget/settings` + `/api/budget/terms` in parallel
- `setWeeklyLimit()`, `setLeaderboardVisible()`, `saveTerms()`, `addHoliday()`, `deleteHoliday()`

**`budgetCommandStore.ts`** — persisted as `studysesh-budget-commands`
- Same shape as `commandStore.ts`: `open, recentCommandIds, openPalette(), closePalette(), addRecentCommand()`

**`budgetTransactionModalStore.ts`** — NOT persisted
- Same shape as `taskModalStore.ts`: `isOpen, editingId, defaultDate, open(), close()`

---

### Phase 5 — Academic Calendar Algorithm (`src/budget/lib/academicCalendar.ts`)

Pure functions, no side effects. Uses `date-fns`.

```typescript
export interface AcademicWeek {
  termName: string; termIndex: number; weekIndex: number
  label: string          // "Term 1, Week 3"
  mondayDate: string     // 'YYYY-MM-DD'
  sundayDate: string     // 'YYYY-MM-DD'
  holidays: BudgetHolidayItem[]
}

export function computeAcademicWeeks(
  terms: BudgetTermItem[],
  holidays: BudgetHolidayItem[]
): AcademicWeek[]
```

**Algorithm per term:**
1. `termStart = startOfWeek(parseISO(term.startDate), { weekStartsOn: 1 })` — snap to preceding Monday
2. Generate 10 weeks: `addDays(termStart, weekIndex * 7)` for Monday, `addDays(monday, 6)` for Sunday
3. Filter holidays whose date falls within `[mondayDate, sundayDate]`
4. Return 40 total AcademicWeek objects (10 per term × 4 terms)

**Helper functions:**
- `getCurrentAcademicWeek(weeks, today)` — find week where `today` is in range
- `getAcademicWeekForDate(weeks, dateStr)` — for mapping a transaction date to its term/week label
- `getMondayOfWeek(dateStr)` — utility using `startOfWeek`

---

### Phase 6 — Budget App Components (`src/budget/`)

**`BudgetApp.tsx`**
- Calls `useThemeApplicator()` (shared hook)
- On mount: `hydrateFromToken()` → if ok, `syncCategories()` + `syncSettings()` + `fetchCurrentWeek()`
- If not authed → renders `<AuthModal open={true} onClose={() => {}} />` (reuse existing)
- Layout: `<BudgetHeader />` + main flex row: `<WeeklyOverviewPanel style={{width:'25%'}} />` + `<SpendingTable style={{flex:1}} />`
- Global modals: `<AddTransactionModal />`, `<BudgetCommandPalette />`, `<ToastContainer />`

**`BudgetHeader.tsx`**
- App name "Budget" (with wallet icon from lucide-react)
- `<a href="/study">StudySesh</a>` link (full nav)
- Graphs button, Leaderboard button, Settings button (opens `SettingsModal` with `initialSection='budget-categories'`)
- User avatar reusing `authStore.user?.avatarBase64` + display name

**`WeeklyOverviewPanel.tsx`**
- Week label: current AcademicWeek label or "Week of Mon DD MMM"
- Spending bar: `spent / weeklyLimit` as `<progress>`-style div. Colors: green < 80%, amber 80–100%, red > 100%. Shows "SGD XX.XX / SGD XX.XX"
- Category pie chart: `recharts` `PieChart` + `Pie` + `Cell`, colored by `category.color`. `ResponsiveContainer width="100%" height={200}`
- Quick stats: transaction count, largest single expense, most-used category name

**`SpendingTable.tsx`**
- Header: `← | Mon DD MMM – Sun DD MMM | →` week navigation. Disable `→` when on current week or future
- `<table>` with thead: `# | Date | Name | Amount | Category | Notes`
- tbody: one row per transaction, sorted by date then createdAt
- Inline editing: click Name/Amount/Notes to replace with `<input>` that saves on blur/Enter (calls `updateTransaction`)
- Category cell: colored dot + name, click shows a small dropdown (pill list of categories)
- Footer total row
- "+ Add transaction" button at bottom or empty-state prompt when no transactions

**`AddTransactionModal.tsx`**
- Reuses `<Modal size="md">` from `src/components/ui/Modal.tsx`
- Fields: Name (autofocus text), Amount (number, step=0.01), Date (date input, default today), Category (pill selector matching subject picker pattern from AddTaskModal), Notes (textarea optional)
- Validation: name + amount required. Submit calls `budgetTransactionStore.addTransaction()`
- Opens via `useBudgetTransactionModalStore().open()`; edit mode pre-fills fields

**`BudgetCommandPalette.tsx`**
- Same `cmdk` `<Command>` pattern as `CommandPalette.tsx`
- Uses `useBudgetCommandStore` and `useBudgetCommandActions()`
- Keyboard handler `useEffect`: `meta+k` → toggle palette; when palette closed, `bindings['budget-transaction-add']` (default `meta+a`) → open transaction modal

**`hooks/useBudgetCommandActions.ts`**
Commands:
- `budget-add-transaction` — "Add Transaction" (⌘A), opens transaction modal
- `budget-view-graphs` — "View Spending Graphs" 
- `budget-leaderboard` — "View Leaderboard"
- `budget-settings` — "Budget Settings", opens SettingsModal
- `budget-prev-week` / `budget-next-week` — "Previous/Next Week"
- `budget-go-studysesh` — "Open StudySesh", `window.location.href = '/study'`

**`SpendingGraphs.tsx`** (modal or slide-in panel)
- Period toggle: Weekly | Monthly | Termly
- Weekly: `recharts` `BarChart` — past 12 weeks on x-axis, total spent on y-axis. Fetches transactions per week lazily
- Monthly: aggregate by calendar month
- Termly: aggregate by academic term (requires terms configured)
- Category breakdown: `PieChart` for the selected period

**`BudgetLeaderboardModal.tsx`**
- Reuses `<Modal size="lg">`
- Week selector (defaults to current week)
- CSS Grid table: `# | Name | Spent | Limit | Surplus | % Under Budget`
- Color code Surplus: green if positive, red if negative
- If current user opted out: show "You are hidden. Change in Settings → Budget."

---

### Phase 7 — Settings Integration

**`src/stores/shortcutsStore.ts`**
- Add `'budget-transaction-add'` to `ShortcutId` union
- Add label: `'budget-transaction-add': 'Add transaction (Budget)'`
- Add default: `'budget-transaction-add': 'meta+a'`
- Appears in shortcuts editor automatically

**`src/hooks/useCommandActions.ts`**
- Add one command to the memo array:
  ```typescript
  {
    id: 'nav-budget',
    label: 'Open Budget Tracker',
    category: COMMAND_CATEGORIES.SETTINGS,
    icon: Wallet,
    keywords: ['budget', 'finance', 'money', 'spending'],
    action: () => { window.location.href = '/budget'; cmd.closePalette() },
  }
  ```

**`src/components/settings/SettingsModal.tsx`**
- Add `'budget-categories'` and `'budget-calendar'` to the `Section` type
- Add two sidebar nav entries (below existing sections)
- Add `useEffect` to sync budget stores when either budget section opens
- **`budget-categories` section**: Identical to the `subjects` section but reads/writes `useBudgetCategoryStore`. Color picker + name input, add/delete buttons.
- **`budget-calendar` section**:
  - 4 term rows: Name / Start Date / End Date inputs
  - "Save Calendar" → `budgetSettingsStore.saveTerms()`
  - Computed weeks table: renders `computeAcademicWeeks(terms, holidays)` as compact rows: "Term 1, Week 1: Mon 3 Feb – Sun 9 Feb"
  - Holidays: list with delete, add form (date + name)
  - Weekly limit: number input, saves on blur
  - Leaderboard visibility: checkbox toggle

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `vite.config.ts` | `base: '/'` |
| `server/index.ts` | Remove path rewrite; add /study/* /budget/* SPA fallbacks; mount 5 new routes |
| `server/db.ts` | Add 5 new tables |
| `src/App.tsx` | Rename to `StudySeshApp`, add pathname dispatch wrapper |
| `src/types/api.ts` | Append 8 new interfaces |
| `src/lib/api.ts` | Add `budget` namespace |
| `src/stores/shortcutsStore.ts` | Add `budget-transaction-add` |
| `src/hooks/useCommandActions.ts` | Add "Open Budget Tracker" command |
| `src/components/settings/SettingsModal.tsx` | Add 2 budget sections |

## New Files to Create

**Server:** `server/routes/budget/categories.ts`, `transactions.ts`, `settings.ts`, `terms.ts`, `leaderboard.ts`

**Stores:** `src/stores/budgetCategoryStore.ts`, `budgetTransactionStore.ts`, `budgetSettingsStore.ts`, `budgetCommandStore.ts`, `budgetTransactionModalStore.ts`

**Budget app:** `src/budget/BudgetApp.tsx`, `src/budget/lib/academicCalendar.ts`, `src/budget/hooks/useBudgetCommandActions.ts`

**Components:** `src/budget/components/BudgetHeader.tsx`, `WeeklyOverviewPanel.tsx`, `SpendingTable.tsx`, `AddTransactionModal.tsx`, `BudgetCommandPalette.tsx`, `SpendingGraphs.tsx`, `BudgetLeaderboardModal.tsx`

**Shared hook:** `src/hooks/useThemeApplicator.ts`

---

## Verification

1. `npm run dev:all` — both `/study` and `/budget` load in browser
2. Log in on `/study`, navigate to `/budget` — still logged in (same localStorage token)
3. Change theme in `/study` settings — switch to `/budget`, same theme applied immediately on load
4. Add a transaction on `/budget` — persists after page refresh
5. Add budget categories in Settings → Budget Categories — appear in transaction modal dropdown
6. Enter term dates in Settings → Budget Calendar — computed week list renders correctly
7. Two users set weekly limits and add transactions — leaderboard ranks them by % under budget
8. `Cmd+A` opens transaction modal in `/budget`
9. `Cmd+K` on `/study` → "Open Budget Tracker" navigates to `/budget`
10. Custom shortcuts for `budget-transaction-add` rebind correctly in Settings → Shortcuts
