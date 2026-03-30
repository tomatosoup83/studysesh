# Plan: 5 Bug Fixes & Features

## Context
Five improvements to the studysesh app:
1. Pomodoro timer ticks don't feed into session focus time
2. Dark mode text is too dim (muted text vars are near-invisible)
3. Alarm sound file exists at sounds/alarm.mp3 but is never played
4. Task creation is an inline form in each column — needs a Todoist-style full modal
5. Command palette "Add Task" calls an unwired callback and does nothing

---

## Fix 1: Timer → Session Focus Time

**Problem:** `useTimer.ts` calls `tick()` every second but never calls `sessionStore.addFocusTime()`. The session focus counter stays at 0.

**Fix:** In `src/hooks/useTimer.ts`, inside the `setInterval` callback, after calling `tick()`, also call `useSessionStore.getState().addFocusTime(1)` — but only when:
- Session `isActive` is true
- Timer mode is `'pomodoro'` (not break modes)
- Status is `'running'`

Also call `useSessionStore.getState().incrementPomodoro()` when `handleComplete()` fires for a pomodoro (currently only `completePomodoro()` from timerStore is called — the sessionStore pomodoro counter is also never incremented).

**Files to modify:**
- `src/hooks/useTimer.ts`

---

## Fix 2: Dark Mode Text Visibility

**Problem:** In dark theme, `--color-text-muted` is `#475569` — nearly invisible against `#1e293b` surface backgrounds.

**Fix:** In `src/styles/themes.css`, update the dark theme:
- `--color-text-muted`: `#475569` → `#94a3b8` (matches light theme's secondary, readable)
- `--color-text-secondary`: `#94a3b8` → `#cbd5e1` (brighter, clearly readable)

**Files to modify:**
- `src/styles/themes.css`

---

## Fix 3: Alarm Sound on Timer Complete

**Problem:** `sounds/alarm.mp3` exists at project root but is never played. Howler.js is already in dependencies but unused for this.

**Fix:**
1. Move `sounds/alarm.mp3` → `public/sounds/alarm.mp3` so Vite serves it as a static asset at `/sounds/alarm.mp3`
2. Create `src/lib/alarm.ts` — a module that exports `playAlarm()` using Howler
3. In `src/hooks/useTimer.ts`, call `playAlarm()` inside `handleComplete()` when the mode that just completed was `'pomodoro'`

```ts
// src/lib/alarm.ts
import { Howl } from 'howler'
const sound = new Howl({ src: ['/sounds/alarm.mp3'], volume: 0.7 })
export function playAlarm() { sound.play() }
```

**Files to create/modify:**
- `public/sounds/alarm.mp3` (move from `sounds/`)
- `src/lib/alarm.ts` (new)
- `src/hooks/useTimer.ts`

---

## Fix 4: Todoist-Style Task Creation Modal

**Problem:** Task creation is an inline form per kanban column. No modal exists.

**Design (matching the screenshot):**
- Full-width title input (large, placeholder "Task name")
- Description textarea below
- Row of pill buttons: Priority (flag + P1/P2/P3/P4 dropdown), Subject (book icon + dropdown), Column (inbox icon + dropdown), Pomodoro toggle (tomato icon + estimated count input)
- Footer: column label on left; Cancel + Add Task buttons on right

**New component:** `src/components/board/AddTaskModal.tsx`
- Uses existing `Modal` component (`size="md"`)
- Calls `useTaskStore().addTask(title, { priority, subjectId, columnId, estimatedPomodoros })` on submit
- Priority options: low / medium / high (with color-coded flags matching existing Priority type)
- Column options: not-started / in-progress / completed (from existing COLUMNS constant)
- Subject options: from `useSubjectStore()` (or whatever subject store exists)
- Pomodoro toggle: shows estimated pomodoro count input when enabled

**Modal open state:** Add a small store `src/stores/taskModalStore.ts`:
```ts
{ isOpen: boolean; open: () => void; close: () => void }
```

**Files to create:**
- `src/stores/taskModalStore.ts`
- `src/components/board/AddTaskModal.tsx`

**Files to modify:**
- `src/App.tsx` — mount `<AddTaskModal />`

---

## Fix 5: Wire Command Palette "Add Task"

**Problem:** `useCommandActions` has `onAddTask?: () => void` but it's called without passing a handler. Selecting "Add New Task" from the palette just closes the palette.

**Fix:** In `src/components/command/CommandPalette.tsx`, pass `useTaskModalStore().open` as the `onAddTask` callback to `useCommandActions`.

**Files to modify:**
- `src/components/command/CommandPalette.tsx`

---

## Implementation Order

1. `src/styles/themes.css` — dark mode text fix (isolated, no deps)
2. Move alarm.mp3 to public/, create `src/lib/alarm.ts`
3. `src/hooks/useTimer.ts` — fix focus time + pomodoro counter + alarm call
4. `src/stores/taskModalStore.ts` — tiny new store
5. `src/components/board/AddTaskModal.tsx` — full modal component
6. `src/App.tsx` — mount AddTaskModal
7. `src/components/command/CommandPalette.tsx` — wire onAddTask

---

## Verification

- **Focus time**: Start session → start pomodoro timer → focus counter in SessionTracker climbs in real time
- **Dark mode**: Switch to dark theme → all text clearly readable including muted/secondary labels
- **Alarm**: Complete a pomodoro (or set a 5s timer for testing) → alarm.mp3 plays
- **Task modal**: Click "+" in any kanban column header OR open command palette → "Add New Task" → modal appears with all fields
- **Command palette**: Cmd+K → type "add" → select "Add New Task" → modal opens
