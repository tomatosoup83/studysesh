# StudySesh — Multi-User Tracking Plan

## Context

The app is currently a single-user, frontend-only SPA with no backend. This plan adds a Node.js/Hono server with a SQLite database so that multiple users (a study group) can each record their sessions, compete on a live scoreboard, and download daily CSV exports. A first-run name prompt establishes user identity with zero auth overhead.

---

## Additional Features Suggested (beyond the user's list)

1. **Streaks** — consecutive days studied per user, shown on the scoreboard
2. **Personal history tab** — click a name on the scoreboard to see that user's last 30 sessions
3. **Session notes** — optional text field in the post-session modal ("what did you work on?")
4. **Goals** — set a daily focus target (e.g. 2h), show a progress bar in SessionTracker
5. **Live scoreboard updates** — Server-Sent Events push a new snapshot whenever anyone ends a session (no polling)
6. **Discord webhook** — optional end-of-day summary posted to a channel automatically
7. **Data export page** — `/export` UI listing all days with available CSV downloads

> **Scope for this implementation:** All 4 are included (streaks, goals, session notes, personal history). Items 5–7 are future extensions.

## Deployment Target: Local Machine / LAN

- Server binds to `0.0.0.0:3001` so all devices on the same WiFi can reach it
- Vite dev server runs with `--host` flag (exposes on LAN at `http://192.168.x.x:5173`)
- Users on other devices open `http://<host-machine-IP>:5173` in dev, or `http://<host-machine-IP>:3001` in prod (Hono serves the built frontend)
- No HTTPS needed for LAN use (browser notifications still work on localhost; other machines may need a workaround or just skip notifications)

---

## Tech Stack (additions only)

| Concern | Choice | Reason |
|---|---|---|
| Server framework | **Hono** + `@hono/node-server` | First-class TS, tiny, can serve static files in prod |
| Database | **SQLite** via `better-sqlite3` | Zero-setup, file on disk, sync API, trivial backup |
| No ORM | Raw SQL | Only ~8 queries total; ORM overhead not justified |
| CSV | Generated on-demand in memory | No sync complexity, instant at this scale |
| Dev runner | `tsx` + `concurrently` | Runs `.ts` server directly; `concurrently` runs both servers |

---

## Directory Structure

```
studysesh/
├── src/
│   ├── stores/
│   │   ├── userStore.ts          # NEW — name in localStorage
│   │   └── scoreboardStore.ts    # NEW — leaderboard UI state + fetch
│   ├── components/
│   │   ├── session/
│   │   │   ├── UserNameModal.tsx      # NEW — first-run name prompt
│   │   │   └── SessionTracker.tsx     # MOD — add scoreboard + goal buttons
│   │   └── scoreboard/
│   │       └── ScoreboardModal.tsx    # NEW — leaderboard with period tabs
│   ├── types/
│   │   ├── session.ts            # MOD — add idleSeconds to SessionSummary
│   │   └── api.ts                # NEW — shared request/response types
│   └── lib/
│       └── api.ts                # NEW — typed fetch wrapper
├── server/
│   ├── index.ts                  # Hono app, mounts routes, serves static in prod
│   ├── db.ts                     # SQLite init + schema
│   ├── tsconfig.json             # Node-targeted tsconfig (separate from Vite)
│   └── routes/
│       ├── sessions.ts           # POST /api/sessions
│       ├── leaderboard.ts        # GET /api/leaderboard
│       └── csv.ts                # GET /api/csv/:date, GET /api/csv (list)
├── data/                         # gitignored
│   └── studysesh.db              # SQLite file created at runtime
└── vite.config.ts                # MOD — add /api proxy to localhost:3001
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name   TEXT    NOT NULL,
  date        TEXT    NOT NULL,       -- "YYYY-MM-DD", derived server-side from ended_at
  started_at  INTEGER NOT NULL,       -- ms timestamp
  ended_at    INTEGER NOT NULL,       -- ms timestamp
  focus_secs  INTEGER NOT NULL DEFAULT 0,
  idle_secs   INTEGER NOT NULL DEFAULT 0,
  pomodoros   INTEGER NOT NULL DEFAULT 0,
  tasks_done  INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,                   -- optional session note
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_sessions_date      ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_name, date);

CREATE TABLE IF NOT EXISTS goals (
  user_name         TEXT    PRIMARY KEY,
  daily_focus_mins  INTEGER NOT NULL DEFAULT 120,
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
```

---

## API Endpoints

### `POST /api/sessions`
Save a completed session.
```ts
// Request
{ userName, startedAt, endedAt, focusSecs, idleSecs, pomodoros, tasksDone, notes? }
// Response 201
{ id: number, date: string }
// Response 400
{ error: string }
```

### `GET /api/leaderboard?period=daily|weekly|monthly|yearly&date=YYYY-MM-DD`
Aggregated stats per user for the period containing `date` (defaults to today).
```ts
// Response 200
{
  period, rangeStart, rangeEnd,
  entries: [{ rank, userName, totalFocusMins, totalIdleMins, totalPomodoros, totalTasksDone, sessionCount, streak }]
}
```
Sorted by `totalFocusMins DESC`. Streak = consecutive days with ≥1 session up to and including today, computed per user.

### `GET /api/sessions/:userName?limit=30`
Last N sessions for a user (personal history).
```ts
// Response 200
{ sessions: [{ id, date, focusSecs, idleSecs, pomodoros, tasksDone, notes, endedAt }] }
```

### `GET /api/csv/:date`
On-demand CSV download for a calendar day.
```
Content-Disposition: attachment; filename="studysesh-2026-03-29.csv"
Date,Name,Focus Time (min),Idle Time (min),Pomodoros,Tasks Completed,Notes
```
One row per session. Returns 404 JSON if no data for that date.

### `GET /api/csv`
List of all dates with session data.
```ts
// Response 200
{ dates: string[] }  // ["2026-03-28", "2026-03-29"]
```

### `GET /api/goals/:userName` and `PUT /api/goals/:userName`
Get and set daily focus goal in minutes.

---

## Frontend Changes

### New: `src/types/api.ts`
All request/response interfaces. Imported by both frontend and server.

### New: `src/lib/api.ts`
```ts
export const api = {
  postSession(body: PostSessionBody): Promise<PostSessionResponse>
  getLeaderboard(period, date?): Promise<LeaderboardResponse>
  getUserSessions(userName, limit?): Promise<UserSessionsResponse>
  getCsvUrl(date: string): string
  getGoal(userName): Promise<GoalResponse>
  setGoal(userName, dailyFocusMins): Promise<void>
}
```
All calls go to `/api/...` — Vite proxies to `:3001` in dev; same origin in prod.

### New: `src/stores/userStore.ts`
```ts
{ userName: string | null, setUserName(name: string): void }
```
Persisted under `studysesh-user`. `null` = first-time user → show `UserNameModal`.

### New: `src/stores/scoreboardStore.ts`
```ts
{ isOpen, period, data, isLoading, error, openScoreboard(), closeScoreboard(), setPeriod(), fetchLeaderboard() }
```
Not persisted.

### Modified: `src/types/session.ts`
Add `idleSeconds: number` to `SessionSummary`.

### Modified: `src/stores/sessionStore.ts`
1. Include `idleSeconds` in the summary snapshot built in `endSession()`
2. After setting state, fire-and-forget `api.postSession(...)` if `userStore.userName` is set

### Modified: `src/components/session/SessionTracker.tsx`
Add two icon buttons in the header row (next to Start/End):
- **Trophy** → `scoreboardStore.openScoreboard()`
- **Target** → inline goal-setting popover (input for daily minutes)
Add a thin goal progress bar below the stats grid when a goal is set: `X min / Y min goal today`

### New: `src/components/session/UserNameModal.tsx`
Shown when `userName === null`. Single text input + "Let's go" button. No dismiss/skip — must set a name to proceed. Added to `App.tsx` alongside `SessionSummaryModal`.

### New: `src/components/scoreboard/ScoreboardModal.tsx`
Uses existing `Modal` with `size="lg"`. Layout:
- Period tabs: Daily | Weekly | Monthly | Yearly (same pill style as timer mode tabs)
- Rank table: # | Name | Focus | Idle | 🍅 | Tasks | Sessions | Streak
- "Personal history" expandable row — click a row to see last 10 sessions inline
- "Download CSV" button for the current period's date
- Fetches on open and tab change; shows skeleton rows while loading

### Modified: `vite.config.ts`
```ts
server: { proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } } }
```

---

## Server Implementation

### `server/db.ts`
- Opens `./data/studysesh.db` (creates if absent)
- Runs `CREATE TABLE IF NOT EXISTS` for both tables
- Exports the `db` instance for use in routes

### `server/index.ts`
- Mounts all routes under `/api`
- In production (when `./dist` exists): serves it via `serveStatic`
- Listens on port `3001` (configurable via `PORT` env var)

### `server/routes/sessions.ts`
Validates body, derives `date` from `ended_at` timestamp, inserts row, returns `{ id, date }`.

### `server/routes/leaderboard.ts`
Computes date range from `period` + `date` param. Runs aggregation query. Computes streak per user with a second query (consecutive day check). Assigns ranks. Returns JSON.

### `server/routes/csv.ts`
Queries sessions for the date, builds CSV string manually (no library needed), sets headers, returns as text.

---

## New Scripts (`package.json`)

```json
"dev:server": "tsx watch server/index.ts",
"dev:all":   "concurrently -n vite,server -c cyan,yellow \"npm run dev\" \"npm run dev:server\"",
"start":     "node --experimental-strip-types server/index.ts"
```

New devDependencies: `hono`, `@hono/node-server`, `better-sqlite3`, `@types/better-sqlite3`, `concurrently`, `tsx`

### LAN-specific script changes
```json
"dev":        "vite --host",
"dev:server": "tsx watch server/index.ts",
"dev:all":    "concurrently -n vite,server -c cyan,yellow \"npm run dev\" \"npm run dev:server\""
```
`--host` makes Vite accessible to other machines on the network. Server already binds `0.0.0.0` via `serve({ port: 3001, hostname: '0.0.0.0' })` in `server/index.ts`.

---

## Implementation Order

1. `server/tsconfig.json`, `server/db.ts`, `server/index.ts` skeleton
2. `server/routes/sessions.ts` — test with `curl -X POST`
3. `src/types/api.ts`, `src/lib/api.ts`
4. `src/stores/userStore.ts` + `UserNameModal.tsx` + wire into `App.tsx`
5. Modify `sessionStore.ts` — capture `idleSeconds` in summary, fire POST
6. `server/routes/leaderboard.ts` — test with `curl`
7. `src/stores/scoreboardStore.ts` + `ScoreboardModal.tsx`
8. Scoreboard + goal buttons in `SessionTracker.tsx`
9. `server/routes/csv.ts` + CSV download link in `ScoreboardModal`
10. `vite.config.ts` proxy + `dev:all` script
11. `npm run build` + verify prod static serving

---

## Verification

- `npm run dev:all` — both servers start, no errors
- Enter name on first load → stored in localStorage → name prompt never appears again
- End a session → POST appears in server logs → row in `data/studysesh.db`
- Open scoreboard → leaderboard shows current user's stats → period tabs change the data
- Click Download CSV → file downloads with correct headers and rows
- Goal progress bar appears after setting a goal; fills as focus time accumulates today
- Multiple browser tabs (simulating different users) → each posts independently → all appear on scoreboard
