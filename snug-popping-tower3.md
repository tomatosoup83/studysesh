# StudySesh — Custom Color Presets, Subjects Settings, Due Dates & Calendar

## Context
Three feature additions:
1. **Custom color presets** — users can name and save their custom themes to a shared community list (like quotes)
2. **Subjects settings section** — manage subjects (add/delete) directly in Settings instead of only via task creation
3. **Task due dates + calendar** — tasks can be assigned a date, calendar view shows tasks by date

---

## Feature 1: Saveable Custom Color Presets

### Backend

**`server/db.ts`** — add new table (safe CREATE IF NOT EXISTS):
```sql
CREATE TABLE IF NOT EXISTS color_presets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vars_json TEXT NOT NULL,
  created_by TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
)
```

**`server/routes/presets.ts`** — new file:
- `GET /` — no auth, returns all presets ordered by `created_at DESC`
- `POST /` — requireAuth, body `{name, vars}`, validates non-empty name + vars object, saves, returns 201
- `DELETE /:id` — requireAuth, deletes by id (no ownership check, like quotes)

Helper `presetToJson(r)` maps `vars_json` through `JSON.parse`.

**`server/index.ts`** — add `app.route('/api/presets', presetsRoute)`

### Frontend

**`src/types/api.ts`** — add:
```typescript
export interface ColorPresetItem {
  id: string; name: string
  vars: Record<string, string>
  createdBy: string | null; createdAt: number
}
export interface ColorPresetsResponse { presets: ColorPresetItem[] }
```

**`src/lib/api.ts`** — add `presets` namespace: `getAll()`, `save(name, vars)`, `delete(id)`

**`src/components/settings/SettingsModal.tsx`** — appearance section additions:
- State: `presets: ColorPresetItem[]`, `presetName: string`, `presetSaving: boolean`
- `useEffect` fetches on `open && section === 'appearance'`
- **"Save as preset" form** — only shown when `theme === 'custom'`: name input + Save button; calls `api.presets.save(presetName, customThemeVars)`, prepends to local list
- **"Community Presets" list** — below built-in swatches: shows 7-swatch color mini-strip, preset name, "by [creator]", Apply button, auth-gated Delete icon
- `handleApplyPreset(preset)` — iterates `CSS_VAR_KEYS`, calls `setCustomThemeVar(key, preset.vars[key])`, then `setTheme('custom')`

---

## Feature 2: Subjects Section in Settings

All changes confined to **`src/components/settings/SettingsModal.tsx`**:

- Extend `Section` type: add `'subjects'`
- Add `{ key: 'subjects', label: 'Subjects' }` to `sections` array
- Destructure `{ subjects, addSubject, deleteSubject }` from `useTaskStore()`
- State: `newSubjectName: string`, `newSubjectColor: string` (default `'#6366f1'`), `subjectSaving: boolean`
- `handleAddSubject(e)` — validate name non-empty, call `addSubject(name, color)`, reset form
- `handleDeleteSubject(id)` — call `deleteSubject(id)` directly (no confirmation needed)
- JSX section for `section === 'subjects'`:
  - Intro: "Add custom subjects to tag your tasks"
  - Form: `<input type="color">` + text name input + Add button (disabled while saving or name empty)
  - Scrollable list: color circle + name + auth-gated hover-delete (Trash2 icon) — same layout as quotes
  - Empty state: "No subjects yet"
- No server changes needed (routes already exist)

---

## Feature 3: Task Due Dates + Calendar

### DB Migration (server/db.ts)
```typescript
try { db.prepare('ALTER TABLE tasks ADD COLUMN due_date INTEGER').run() } catch {}
```

### Server (server/routes/tasks.ts)
- Add `due_date: number | null` to `TaskRow` interface
- Add `dueDate: r.due_date ?? undefined` to `taskToJson()`
- POST handler: destructure `dueDate` from body, add to INSERT statement and values
- PATCH `fieldMap`: add `dueDate: 'due_date'`

### Types
**`src/types/task.ts`** — add `dueDate?: number` to `Task` interface

**`src/types/api.ts`** — add `dueDate?: number | null` to `TaskItem`

### Store
**`src/stores/taskStore.ts`**:
- `addTask` opts: add `dueDate?: number`
- `addTask` implementation: include `dueDate` in task object and API body
- `syncFromServer`: add `dueDate: t.dueDate ?? undefined` when building each task

**`src/stores/taskModalStore.ts`** — extend to carry prefill date:
```typescript
interface TaskModalStore {
  isOpen: boolean
  defaultDueDate: number | null   // NEW
  open: (defaultDueDate?: number) => void
  close: () => void
}
```
- `open(defaultDueDate?)` — `set({ isOpen: true, defaultDueDate: defaultDueDate ?? null })`
- `close()` — `set({ isOpen: false, defaultDueDate: null })`

### Task Card UI

**`src/components/board/TaskCard.tsx`**:
- Import `format`, `isPast`, `isToday` from `date-fns`; `CalendarDays` from `lucide-react`
- Add due date badge in bottom badges row (only when `task.dueDate && task.columnId !== 'completed'`):
  - Red if overdue (`isPast(dueDate) && !isToday(dueDate)`)
  - Warning color if due today
  - Muted otherwise
  - Label: `<CalendarDays size={9} /> {format(task.dueDate, 'MMM d')}`

**`src/components/board/AddTaskModal.tsx`**:
- Read `defaultDueDate` from `useTaskModalStore()`
- State: `dueDate: string` initialized from `defaultDueDate` via `format(defaultDueDate, 'yyyy-MM-dd')` if set
- Add date pill button (same styling as priority/subject pills) that toggles a `<input type="date">` inline
- Pass `dueDate ? parseISO(dueDate).getTime() : undefined` to `addTask` opts

**`src/components/board/TaskCardExpanded.tsx`**:
- State: `dueDate: string` initialized from `task.dueDate` via `format`
- Import `format`, `parseISO` from `date-fns`
- Add a due date row (after badges row): label + `<input type="date">` styled like existing inputs + Clear button
- Include `dueDate: dueDate ? parseISO(dueDate).getTime() : undefined` in `updateTask` call on close

### Calendar

**`src/components/calendar/CalendarModal.tsx`** — new file, new directory:

Props: `{ open: boolean, onClose: () => void }`

Internal state: `currentMonth: Date`, `expandedTask: Task | null`

Data: reads `tasks`, `subjects` from `useTaskStore()`. Uses `useTaskModalStore().open`.

Grid computation with date-fns:
- `startOfMonth` / `endOfMonth` → `startOfWeek` / `endOfWeek` (weekStartsOn: 0) → `eachDayOfInterval` → 35–42 cells
- `getTasksForDay(day)` — filter tasks where `isSameDay(new Date(t.dueDate!), day)`

Render inside `<Modal open={open} onClose={onClose} title="Calendar" size="xl">`:
1. Navigation header: `←` prev month + `"Month YYYY"` + `→` next month
2. Day-name row: Sun Mon … Sat
3. 7-column grid (`grid grid-cols-7 gap-px`, border-collapse via bg on grid):
   - Each cell: day number (circle if `isToday`) + up to 3 task chips + "+N more" if overflow
   - Task chip: subject color background, truncated title, click → `setExpandedTask(task)` (stopPropagation)
   - Click cell background → `open(day.getTime())` to open AddTaskModal pre-filled with that date
   - Cells outside current month: `opacity-40`
4. `{expandedTask && <TaskCardExpanded task={expandedTask} onClose={() => setExpandedTask(null)} />}`

**`src/components/layout/LeftPanel.tsx`** — add calendar button:
- Import `CalendarDays` from `lucide-react`, `CalendarModal`, `useState`
- State: `showCalendar: boolean`
- Add calendar icon button to task board header row (alongside existing stats button, same styling)
- Add `<CalendarModal open={showCalendar} onClose={() => setShowCalendar(false)} />`

---

## Critical Files
- `server/db.ts` — new table + migration
- `server/routes/presets.ts` — new file
- `server/index.ts` — route registration
- `server/routes/tasks.ts` — due_date support
- `src/types/task.ts` + `src/types/api.ts` — type additions
- `src/stores/taskStore.ts` — dueDate in addTask/syncFromServer
- `src/stores/taskModalStore.ts` — defaultDueDate field
- `src/components/settings/SettingsModal.tsx` — presets + subjects sections
- `src/components/board/TaskCard.tsx` — due date badge
- `src/components/board/TaskCardExpanded.tsx` — due date field
- `src/components/board/AddTaskModal.tsx` — due date pill
- `src/components/calendar/CalendarModal.tsx` — new
- `src/components/layout/LeftPanel.tsx` — calendar button

---

## Verification
1. Settings → Appearance → select Custom → edit colors → "Save as preset" → save → appears in Community list → other browser/incognito → appears there too
2. Settings → Subjects → add "Physics" with color → appears in task creation subject dropdown → delete it → gone
3. TaskCardExpanded → set due date → save → card shows date badge (red if past, yellow if today)
4. AddTaskModal → pick a due date → create task → badge appears on card
5. LeftPanel calendar button → opens calendar → navigate months → tasks appear on their due date cells → click task chip → TaskCardExpanded opens → click empty day → AddTaskModal opens pre-filled with that date
6. `npm run build` passes with no TS errors
