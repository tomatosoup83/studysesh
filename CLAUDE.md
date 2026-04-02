# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**studysesh** — full-stack study session tracking app for study groups. Features a Pomodoro timer, Kanban task board, leaderboard, ambient music player, and multi-user session tracking.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand (state), @dnd-kit (drag-and-drop), Howler.js (audio), cmdk (command palette)
- **Backend:** Hono.js on Node.js, SQLite via better-sqlite3, JWT auth (jose + bcryptjs)
- **Build:** Vite for frontend, tsx for backend

## Commands

```bash
# Development (frontend :5173, backend :3001)
npm run dev:all

# Run frontend only
npm run dev

# Run backend only (watch mode)
npm run dev:server

# Build for production
npm run build

# Run production server (serves built frontend + API on :3001)
npm start

# Lint
npm run lint
```

No test runner is configured.

## Architecture

### Frontend (`src/`)

Single-page app with no client-side router. UI state (open modals, active panels) drives what's shown.

- **Layout:** `App.tsx` → Header + resizable LeftPanel (Kanban) + RightPanel (timer/music)
- **State:** 11 Zustand stores in `src/stores/`, most with localStorage persistence. Key stores: `authStore` (JWT + user), `timerStore` (Pomodoro state), `taskStore` (board tasks), `sessionStore` (active session), `settingsStore` (theme/preferences)
- **API client:** `src/lib/api.ts` — fetch wrapper that attaches JWT from `authStore`
- **Themes:** CSS variable-based system in `src/styles/themes.css`; theme key stored in `settingsStore`

### Backend (`server/`)

- **Entry:** `server/index.ts` — Hono app wiring all routes, serves `dist/` in production
- **Database:** `server/db.ts` — SQLite schema + migrations run on startup; DB file at `data/studysesh.db`
- **Auth middleware:** `server/middleware/auth.ts` — verifies JWT Bearer token, attaches `userId` to context
- **Routes:** `server/routes/` — auth, sessions, tasks, leaderboard, goals, csv, quotes

### Key Config

- Vite base path is `/study/` — all asset URLs are relative to that
- Vite proxies `/api/*` → `http://localhost:3001` in dev
- JWT secret defaults to a hardcoded dev value; override with `JWT_SECRET` env var in production
- `better-sqlite3` requires C++ build tools (native addon)
