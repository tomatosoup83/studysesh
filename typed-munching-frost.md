# StudySesh — Large Feature Plan

## Context
Adding a batch of interconnected features: a toast notification system, new keyboard shortcuts, command palette shortcut display, task subject editing, removal of inline task-adding from columns, a "Personal Mode" with separate task storage and per-mode default themes, and a redesigned privacy settings page with mode-aware sharing controls.

---

## Critical File List
- `src/lib/commands.ts` — add `shortcut` field + `SESSION` category
- `src/stores/toastStore.ts` — **new file**
- `src/components/ui/Toast.tsx` — **new file**
- `src/App.tsx` — mount ToastContainer; add mode-change theme effect
- `src/stores/uiStore.ts` — add `mode`/`toggleMode`
- `src/stores/taskModalStore.ts` — add `defaultColumnId` to `open()`
- `src/stores/settingsStore.ts` — update `shareLastTask` type, add `shareSessionData`, add `studyModeTheme`/`personalModeTheme`, add persist migration
- `src/stores/sessionStore.ts` — mode-aware post logic
- `src/types/task.ts` — add optional `mode` field
- `src/stores/taskStore.ts` — pass mode in `addTask`, add `getFilteredTaskOrder`
- `src/hooks/useCommandActions.ts` — new commands, toast calls, shortcut hints
- `src/components/command/CommandPalette.tsx` — new keyboard shortcuts, shortcut reference section
- `src/components/board/KanbanColumn.tsx` — remove inline form, open modal with columnId
- `src/components/board/AddTaskModal.tsx` — use `defaultColumnId` from store; add toast on task add
- `src/components/board/KanbanBoard.tsx` — filter task order by current mode
- `src/components/board/TaskCardExpanded.tsx` — add subject editing dropdown
- `src/components/header/Header.tsx` — mode-aware icon (Brain vs Flower2)
- `src/components/settings/SettingsModal.tsx` — update appearance section (set-as-default button) + privacy section (dropdowns)

---

## Implementation Steps (in order)

### 1. Toast System
**`src/stores/toastStore.ts`** (new):
```ts
type ToastVariant = 'success' | 'info' | 'warning' | 'error'
interface Toast { id: string; message: string; variant: ToastVariant; duration?: number }
interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}
```
Use `nanoid()` for ids. `addToast` pushes to array and schedules `removeToast` via `setTimeout`.

**`src/components/ui/Toast.tsx`** (new):
- `<ToastContainer />` at `fixed bottom-4 right-4 z-[60]`, reads `toastStore.toasts`
- Each `<ToastItem>` slides in, shows icon (CheckCircle/Info/AlertTriangle/XCircle from lucide-react), message, X button
- Use CSS var colors for theming; slide-up animation via inline keyframes or a class in `index.css`

**`src/App.tsx`**: Mount `<ToastContainer />` once at the end of both return branches.

---

### 2. Store Foundation

**`src/stores/uiStore.ts`**: Add `mode: 'study' | 'personal'` (default `'study'`) and `toggleMode()`.

**`src/stores/taskModalStore.ts`**: Change `open` signature to accept an options object:
```ts
open: (opts?: { defaultDueDate?: number; defaultColumnId?: ColumnId }) => void
```
Add `defaultColumnId: ColumnId | null` to state. Only call site is `CommandPalette.tsx` with no args — no change needed there.

**`src/stores/settingsStore.ts`**:
- Change `shareLastTask: boolean` → `'only-study' | 'only-personal' | 'both' | 'none'`
- Add `shareSessionData: 'only-study' | 'only-personal' | 'both' | 'none'` (default `'both'`)
- Add `studyModeTheme: { theme: Theme; customVars?: Record<CssVarKey, string> } | null` (default `null`)
- Add `personalModeTheme: ...` (same, default `null`)
- Add `setShareSessionData`, update `setShareLastTask` signature, add `setModeTheme`
- Add persist `version: 1` + `migrate` to upgrade `shareLastTask` boolean → `'both'`/`'none'`

**`src/types/task.ts`**: Add `mode?: 'study' | 'personal'` to `Task` interface.

**`src/stores/taskStore.ts`**:
- In `addTask`, read current mode from `useUIStore.getState().mode` and set `task.mode` accordingly
- Add `getFilteredTaskOrder(mode): Record<ColumnId, TaskId[]>` method — filters each column's ID list to tasks where `tasks[id].mode ?? 'study' === mode`

**`src/stores/sessionStore.ts`** — in `endSession()`, replace the `shareLastTask` boolean check:
```ts
const { shareSessionData, shareLastTask } = useSettingsStore.getState()
const { mode } = useUIStore.getState()
const shouldShare = shareSessionData === 'both' || shareSessionData === `only-${mode}`
const shouldShareTask = shouldShare && (shareLastTask === 'both' || shareLastTask === `only-${mode}`)
```
Only call `api.postSession` if `shouldShare` is true; pass `shareLastTask: shouldShareTask`.

---

### 3. Commands & Shortcuts

**`src/lib/commands.ts`**:
- Add `shortcut?: string` to `CommandDefinition`
- Add `SESSION: 'Session'` to `COMMAND_CATEGORIES`

**`src/hooks/useCommandActions.ts`**:
- Import `useToastStore`, `useSessionStore`, `useUIStore`
- Add toasts to existing command actions: timer-toggle, music-toggle, theme-*, ui-hyperfocus
- Add new commands:
  - `session-start-stop` (shortcut `⌘⇧S`)
  - `mode-toggle` (shortcut `⌘⇧E`, icon Brain/Flower2)
- Existing timer/music/hyper commands: add `shortcut` display strings (`⌘↩`, `⌘⇧M`, `⌘⇧Space`)

**`src/components/command/CommandPalette.tsx`**:
- Add new keyboard event handlers in the existing `handler`:
  - `metaKey + Enter` → toggle timer + toast
  - `metaKey + Shift + M` → toggle music via `useMusicStore.getState().setPlaying(!)` + toast
  - `metaKey + Shift + S` → start/end session + toast
  - `metaKey + Shift + E` → `uiStore.toggleMode()` + toast
  - `metaKey + Shift + Space` → `uiStore.toggleHyperFocus()` + toast
  - Note: for Shift combos, `e.key` is the uppercase letter (e.g., `'M'`, `'S'`, `'E'`)
- Show `shortcut` in `CommandItem`: render a `<kbd>` element right-aligned when `cmd.shortcut` is set
- Add a static "Shortcuts" group at the bottom of the palette listing all shortcuts as non-interactive reference rows

---

### 4. Task System

**`src/components/board/KanbanColumn.tsx`**:
- Remove `showAddForm` state and `AddTaskForm` import
- "+" button `onClick` → `useTaskModalStore.getState().open({ defaultColumnId: columnId })`
- Remove the inline form JSX block

**`src/components/board/AddTaskModal.tsx`**:
- Read `defaultColumnId` from store
- Initialize `columnId` state from `defaultColumnId ?? 'not-started'`
- In `reset()`, reset to `defaultColumnId ?? 'not-started'`
- After successful `addTask`, show toast: `addToast('Task added', 'success')`

**`src/components/board/KanbanBoard.tsx`**:
- Get `mode` from `useUIStore()`
- Get `getFilteredTaskOrder` from `useTaskStore()`
- Pass `getFilteredTaskOrder(mode)` as the effective task order to each `KanbanColumn` (via prop or by letting columns call the filtered selector)

**`src/components/board/TaskCardExpanded.tsx`**:
- Add `const [subjectId, setSubjectId] = useState(task.subjectId ?? '')`
- Replace read-only subject tag with a clickable pill that opens a simple dropdown listing all subjects + "None"
- In `handleClose`, add `subjectId: subjectId || undefined` to the `updateTask` call

---

### 5. Personal Mode UI

**`src/components/header/Header.tsx`**:
- Import `Flower2` from lucide-react (confirmed available as `flower-2.js`)
- Read `mode` from `useUIStore()`
- Swap Brain icon for Flower2 when `mode === 'personal'`

**`src/App.tsx`** — add a `useEffect` listening to `mode`:
```ts
useEffect(() => {
  const modeDefault = mode === 'study' ? studyModeTheme : personalModeTheme
  if (modeDefault) {
    setTheme(modeDefault.theme)
    if (modeDefault.customVars) {
      // apply each CSS var to document.documentElement
    }
  }
}, [mode])
```

---

### 6. Settings Updates

**`src/components/settings/SettingsModal.tsx`** — Appearance section:
- Read `mode` from `useUIStore()`
- Add button after theme swatches: `"Set as default for [Study/Personal] mode"`
- On click: call `setModeTheme(mode, theme, theme === 'custom' ? customThemeVars : undefined)` + toast

**`src/components/settings/SettingsModal.tsx`** — Privacy section:
- Replace single checkbox with two `<select>` dropdowns
- "Share session data with others": options `both`/`only-study`/`only-personal`/`none`
- "Share last completed task": same options; visually disabled (`opacity-50 pointer-events-none`) when `shareSessionData === 'none'`
- Labels above each dropdown; descriptive subtext below

---

## Verification
1. `npm run dev:all` → open app, all keyboard shortcuts fire toasts
2. Command palette shows shortcut hints next to commands
3. "+" in kanban column opens AddTaskModal pre-selected to that column
4. Task detail modal has subject dropdown that saves on close
5. Header icon changes Brain→Flower2 on mode switch (Cmd+Shift+E)
6. Tasks are filtered per mode (personal mode shows only personal tasks)
7. Settings > Appearance has "Set as default" button; switching modes applies saved theme
8. Settings > Privacy shows two dropdowns; last-task dropdown disables when session = none
9. Session posts respect mode + privacy settings
