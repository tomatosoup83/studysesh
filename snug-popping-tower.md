# StudySesh — Comprehensive Feature Implementation Plan

## Context
StudySesh currently uses a username-only system (no passwords, no real auth) with tasks stored only in browser localStorage, not synced to the server. The user wants: a real account system with persistent login and server-side task storage; leaderboard and QoL improvements; an expanded settings page. This is a large multi-phase effort — the account system must be built first since task-sync and profile features depend on it.

**Tech stack:** React 18 + TypeScript + Zustand + Tailwind CSS + Hono.js + better-sqlite3 (SQLite)

---

## Critical Files
- `server/db.ts` — SQLite schema (add users, tasks, subjects, quotes tables)
- `server/index.ts` — route registration
- `server/routes/sessions.ts` — add lastTaskName field
- `server/routes/leaderboard.ts` — join latest session for lastTaskName
- `src/stores/userStore.ts` — replace with full authStore
- `src/stores/taskStore.ts` — add server-sync layer
- `src/stores/settingsStore.ts` — add shareLastTask, new themes
- `src/stores/sessionStore.ts` — update endSession to send lastTaskName
- `src/lib/api.ts` — add auth headers, new API namespaces
- `src/types/api.ts` — new interfaces
- `src/App.tsx` — mount auth check
- `src/components/header/Header.tsx` — avatar, displayName, hyper-focus, settings
- `src/components/board/KanbanBoard.tsx` — bug fix: call addCompletedTask on drag
- `src/components/scoreboard/ScoreboardModal.tsx` — bigger size, last task column
- `src/components/timer/TimerSettings.tsx` — number input alongside sliders
- `src/styles/themes.css` — add new themes

---

## Phase 1 — Database Schema (`server/db.ts`)

Add to `db.exec(...)` block:

```sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  login_name    TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_base64 TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login_name);

CREATE TABLE IF NOT EXISTS tasks (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT,
  column_id            TEXT NOT NULL DEFAULT 'not-started',
  priority             TEXT NOT NULL DEFAULT 'medium',
  subject_id           TEXT,
  subtasks_json        TEXT NOT NULL DEFAULT '[]',
  estimated_pomodoros  INTEGER,
  actual_pomodoros     INTEGER NOT NULL DEFAULT 0,
  created_at           INTEGER NOT NULL,
  completed_at         INTEGER,
  sort_order           INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);

CREATE TABLE IF NOT EXISTS subjects (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  color    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT NOT NULL UNIQUE,
  added_by   TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

Run these as separate `db.prepare(...).run()` calls (not inside the existing `db.exec`) since SQLite doesn't support `ALTER TABLE` inside multi-statement `exec`:
```ts
try { db.prepare('ALTER TABLE sessions ADD COLUMN last_task_name TEXT').run() } catch {}
try { db.prepare('ALTER TABLE sessions ADD COLUMN share_last_task INTEGER NOT NULL DEFAULT 1').run() } catch {}
```

Seed quotes from `quotes.txt` if table is empty (read file, split by newline, bulk insert).

---

## Phase 2 — Auth Routes (`server/routes/auth.ts` + `server/middleware/auth.ts`)

**Install:** `npm install jose bcryptjs && npm install -D @types/bcryptjs`

- `POST /api/auth/register` — hash password with bcrypt, insert user with nanoid ID, return JWT + user record
- `POST /api/auth/login` — verify password, return JWT + user record
- `GET /api/auth/me` — validate Bearer token, return user record
- `PATCH /api/auth/me` — update displayName, password, avatarBase64

JWT: HS256, 30-day expiry, payload `{ sub: userId, loginName }`. Secret from `process.env.JWT_SECRET` (add default fallback for dev).

Auth middleware extracts userId from Bearer token and sets it on Hono context (`c.set('userId', ...)`). All protected routes use this middleware.

---

## Phase 3 — Tasks & Quotes Routes

**`server/routes/tasks.ts`** (auth required):
- `GET /api/tasks` — return tasks + subjects for user, ordered by sort_order
- `POST /api/tasks` — create task
- `PATCH /api/tasks/:id` — update task fields
- `DELETE /api/tasks/:id` — delete task
- `PUT /api/tasks/order` — bulk update sort_order `{ columnId, taskIds[] }`
- `GET /api/tasks/subjects`, `POST /api/tasks/subjects`, `DELETE /api/tasks/subjects/:id`

**`server/routes/quotes.ts`**:
- `GET /api/quotes` — all quotes (no auth)
- `POST /api/quotes` — add quote (auth required)

Register all routes in `server/index.ts`.

---

## Phase 4 — Update Sessions & Leaderboard

**`server/routes/sessions.ts`:** Accept `lastTaskName` and `shareLastTask` in POST body, insert into sessions table.

**`server/routes/leaderboard.ts`:** Add CTE to get latest session per user in date range, join `last_task_name` and `share_last_task` into leaderboard rows.

---

## Phase 5 — Auth Store (replaces `src/stores/userStore.ts`)

Replace `userStore.ts` with `authStore.ts`:

```typescript
interface AuthStore {
  token: string | null
  user: { id: string; loginName: string; displayName: string; avatarBase64: string | null } | null
  isLoading: boolean
  login(loginName: string, password: string): Promise<void>
  register(loginName: string, displayName: string, password: string): Promise<void>
  logout(): void
  updateProfile(updates: { displayName?: string; password?: string; avatarBase64?: string }): Promise<void>
  hydrateFromToken(): Promise<void>  // validates stored token on app load
}
```

Persist `{ token, user }` under `studysesh-auth`. On 401 from `hydrateFromToken`, clear the store. Update all call sites that used `useUserStore().userName` to use `useAuthStore().user?.displayName`.

---

## Phase 6 — Update `src/lib/api.ts`

Add auth header injection to the central `request()` function:
```typescript
const token = useAuthStore.getState().token
if (token) headers['Authorization'] = `Bearer ${token}`
```

Add new API namespaces: `api.auth.{login, register, me, updateMe}`, `api.tasks.{getAll, create, update, delete, updateOrder, getSubjects, createSubject, deleteSubject}`, `api.quotes.{getAll, add}`.

---

## Phase 7 — Auth UI (`src/components/auth/AuthModal.tsx`)

Replace `UserNameModal` with a tabbed Login/Register modal. Show when `user === null`.

- Register: Display Name, Login Name, Password, Confirm Password
- Login: Login Name, Password
- Error display; loading states

Update `App.tsx` to import `AuthModal`, call `useAuthStore().hydrateFromToken()` on mount, and show `AuthModal` when not authenticated.

---

## Phase 8 — Task Store Server Sync (`src/stores/taskStore.ts`)

Add `syncFromServer()` — call `api.tasks.getAll()`, overwrite local state with server data. Call this after successful login/hydration.

Each mutating action applies optimistically to Zustand, then fires the API call. On failure, revert and log error.

**Bug fix included here:** In `moveTask`, when `toColumn === 'completed'` and previous column was not completed, call `useSessionStore.getState().addCompletedTask(taskId)`.

Sync subjects to server similarly. Keep Zustand persist as offline fallback.

---

## Phase 9 — Bug Fix: Drag to Completed (`src/components/board/KanbanBoard.tsx`)

In `handleDragEnd`, after calling `moveTask(active.id, targetColumn)`, check if the task moved INTO 'completed' from a different column:

```typescript
const { isActive, addCompletedTask } = useSessionStore.getState()
if (isActive && targetColumn === 'completed' && activeTask.columnId !== 'completed') {
  addCompletedTask(active.id as string)
}
```

This is a 5-line fix. The task store's `moveTask` should also do this (Phase 8), but this handles the drag path explicitly.

---

## Phase 10 — Header: Profile Avatar + Display Name (`src/components/header/Header.tsx`)

Add to the right side of the header (before settings button):
- Circular avatar `<img>` (base64 src) or initials fallback circle
- Display name text
- Clicking opens `ProfileModal` (`src/components/auth/ProfileModal.tsx`)

**`ProfileModal`**: Edit display name, password (collapsible), and profile picture. File input → canvas resize to max 256×256 → `canvas.toDataURL('image/jpeg', 0.7)` → base64 preview → save via `updateProfile()`.

---

## Phase 11 — Session Store: Send lastTaskName (`src/stores/sessionStore.ts`)

In `endSession()`, before calling `api.postSession()`:
- Look up last task ID from `tasksCompletedIds`, get its title from `useTaskStore.getState().tasks`
- Read `useSettingsStore.getState().shareLastTask`
- Include `lastTaskName` and `shareLastTask` in the POST body

Update `postSession` signature in `api.ts` and `src/types/api.ts`.

---

## Phase 12 — Leaderboard Improvements (`src/components/scoreboard/ScoreboardModal.tsx`)

1. **Bigger modal:** Add `'xl': 'max-w-3xl'` to `Modal.tsx` size map; change `ScoreboardModal` to use `size="xl"`.

2. **Last task column:** Add a "Last Task" column to the leaderboard grid. If `shareLastTask` is true and `lastTaskName` is set, show the task name (truncated). Otherwise show `"they don't want u to see :("` in muted italic.

Update `LeaderboardEntry` type in `src/types/api.ts` to add `lastTaskName: string | null` and `shareLastTask: boolean`.

---

## Phase 13 — Settings Page (`src/components/settings/SettingsModal.tsx`)

New multi-section modal opened via a gear icon in the header. Sections:
- **Account** — shows displayName, loginName, avatar; "Edit" opens ProfileModal
- **Appearance** — color swatch grid for all 6 themes (light, dark, paper + 3 new)
- **Timer** — move TimerSettings content here
- **Privacy** — "Share last completed task on leaderboard" toggle → `settingsStore.shareLastTask`
- **Quotes** — text input + submit to add a quote; shows recent community quotes (fetched from `GET /api/quotes`)

**New themes** in `src/styles/themes.css`: `ocean`, `forest`, `sunset` — add CSS variable blocks for each.

**`src/stores/settingsStore.ts`:** Add `shareLastTask: boolean` (default true) and 3 new theme options.

---

## Phase 14 — UI Store + Panel Visibility (`src/stores/uiStore.ts`)

New store:
```typescript
interface UIStore {
  musicPanelVisible: boolean
  sessionPanelVisible: boolean
  isHyperFocus: boolean
  toggleMusicPanel(): void
  toggleSessionPanel(): void
  toggleHyperFocus(): void
}
```
Persist under `studysesh-ui`.

**`LeftPanel.tsx`:** Add toggle button to session tracker header. When `sessionPanelVisible` is false, render a slim collapsed header only.

**`RightPanel.tsx`:** Add toggle buttons to music and timer headers. Pause music before hiding music panel. When `isHyperFocus` is true, render only the timer filling the full right column.

**`Header.tsx`:** Add ⚡ hyper-focus button. In hyper-focus mode, `LeftPanel` returns `null`, layout becomes timer-only.

---

## Phase 15 — QoL: Timer Settings Number Input (`src/components/timer/TimerSettings.tsx`)

For each slider (Focus, Short Break, Long Break), add an `<input type="number">` alongside it showing the value in minutes. Both controls stay in sync. On blur/Enter, validate range and call `setTimerDuration`. Layout: `label | [number input]min | [slider]`.

---

## Phase 16 — QoL: Cmd+A Shortcut (`src/components/command/CommandPalette.tsx`)

In the `useEffect` that listens for `Cmd+K`, add:
```typescript
if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
  e.preventDefault()
  useTaskModalStore.getState().open()
}
```

---

## Phase 17 — QoL: Focus Timer Color When Running (`src/components/timer/TimerDisplay.tsx`)

When `status === 'running'` and `mode === 'pomodoro'`, apply `getModeColor(mode)` (which is `var(--color-primary)`) to the timer numeral text, matching the ring color. Pass `isRunning` as a prop (or derive from existing props).

---

## Phase 18 — QoL: Dynamic Quotes in Header

In the header's quote display, replace the static import of `quotes.txt?raw` with a `useEffect` that calls `api.quotes.getAll()` on mount and picks a random quote from the response. Fall back to a hardcoded default while loading.

---

## Phase 19 — More Music Tracks (`src/stores/musicStore.ts`)

Append 3+ entries to `LOFI_PLAYLIST` and `AMBIENT_PLAYLIST` arrays with YouTube video IDs. Pure data change, no structural modifications.

---

## New Files
- `server/routes/auth.ts`
- `server/routes/tasks.ts`
- `server/routes/quotes.ts`
- `server/middleware/auth.ts`
- `src/stores/authStore.ts` (replaces userStore)
- `src/stores/uiStore.ts`
- `src/components/auth/AuthModal.tsx`
- `src/components/auth/ProfileModal.tsx`
- `src/components/settings/SettingsModal.tsx`

## Dependencies to Install
```
npm install jose bcryptjs
npm install -D @types/bcryptjs
```

---

## Verification

1. **Auth flow:** Register a new user → verify JWT stored in localStorage → close and reopen app → verify auto-login and tasks are still there
2. **Task sync:** Add a task → check SQLite `tasks` table for the row → log in from a different browser → verify tasks appear
3. **Drag bug fix:** Start a session → drag a task to Completed → verify session tracker increments "Tasks Completed"
4. **Leaderboard:** End a session with a completed task → open leaderboard → verify last task name column
5. **Hyper focus:** Click ⚡ → verify only timer is shown → click again to restore
6. **Themes:** Open settings → switch to ocean/forest/sunset theme → verify CSS variables apply
7. **Quotes:** Add a quote in settings → reload → verify it appears in header rotation
