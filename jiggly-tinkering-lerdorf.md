# Plan: Task Pie Chart + Timer Max 90 min

## Context
Two independent UI enhancements:
1. A donut chart showing task distribution across the three Kanban columns (not-started / in-progress / completed), accessible from the Task Board panel.
2. Raise the maximum focus timer duration from 60 to 90 minutes.

---

## Feature 1: Task Status Pie Chart

### New file: `src/components/board/TaskStatsModal.tsx`

Create a modal with a custom SVG donut chart (no new dependency needed — SVG natively supports `fill="var(--css-var)"`).

**Data:** Read `taskOrder` from `useTaskStore()`. Count = `taskOrder[columnId].length`.

**Slice colors** (match existing column accents):
```ts
const SLICE_COLORS: Record<ColumnId, string> = {
  'not-started': 'var(--color-text-muted)',
  'in-progress': 'var(--color-primary)',
  'completed':   'var(--color-success)',
}
const LABELS: Record<ColumnId, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  'completed':   'Completed',
}
```

**SVG donut math** — `viewBox="0 0 160 160"`, center `(80, 80)`, outer R=70, inner r=42, gap between slices=0.03 rad:
```ts
function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

function slicePath(cx: number, cy: number, R: number, iR: number, start: number, end: number) {
  const sweep = Math.min(end - start, 2 * Math.PI - 0.001)
  const e = start + sweep
  const large = sweep > Math.PI ? 1 : 0
  const os = polarToCartesian(cx, cy, R, start), oe = polarToCartesian(cx, cy, R, e)
  const is_ = polarToCartesian(cx, cy, iR, start), ie = polarToCartesian(cx, cy, iR, e)
  return `M ${os.x} ${os.y} A ${R} ${R} 0 ${large} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${iR} ${iR} 0 ${large} 0 ${is_.x} ${is_.y} Z`
}
```

Build paths: iterate `['not-started', 'in-progress', 'completed']`, accumulate `cursor` angle starting at `-Math.PI / 2`. Skip slices with count=0.

**Center label:** SVG `<text>` at `(80, 80)` showing total count, second `<text>` at `(80, 94)` showing "tasks".

**Legend:** Below SVG — colored square swatch + label + count + percentage per row.

**Empty state:** When total=0, show a dash and "No tasks yet" instead of the SVG.

**Props:** `{ open: boolean, onClose: () => void }` — wrap in `<Modal size="sm" title="Task Overview">`.

---

### Modify: `src/components/layout/LeftPanel.tsx`

1. Add `import { useState } from 'react'` (not currently imported)
2. Add `import { BarChart2 } from 'lucide-react'` (or `PieChart` — both available in lucide-react)
3. Add `import { TaskStatsModal } from '../board/TaskStatsModal'`
4. Add `const [showStats, setShowStats] = useState(false)` inside the component
5. Change the Task Board header div (line 52–59) from `flex-shrink-0` to `flex-shrink-0 flex items-center justify-between`, add a button:

```tsx
<div className="px-4 py-2.5 border-b flex-shrink-0 flex items-center justify-between"
  style={{ borderColor: 'var(--color-border)' }}>
  <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Task Board</h2>
  <button
    onClick={() => setShowStats(true)}
    title="Task statistics"
    className="p-1.5 rounded-lg transition-colors"
    style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}
  >
    <BarChart2 size={13} />
  </button>
</div>
```

6. Add `<TaskStatsModal open={showStats} onClose={() => setShowStats(false)} />` after the closing `</div>` of the task board section (before line 64).

---

## Feature 2: Timer Max 90 Minutes

Two identical one-line changes:

**`src/components/settings/SettingsModal.tsx` line 305:**
```ts
// before
{ label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 60 * 60 },
// after
{ label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 90 * 60 },
```

**`src/components/timer/TimerSettings.tsx` line 23:**
```ts
// before
{ label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 60 * 60 },
// after
{ label: 'Focus', key: 'pomodoro' as const, min: 5 * 60, max: 90 * 60 },
```

The `max / 60` expression in the `<input max>` and the `max={max}` in `<Slider>` both pick this up automatically — no other changes needed.

---

## Files to Change

| File | Change |
|---|---|
| `src/components/board/TaskStatsModal.tsx` | **New file** — donut SVG chart modal |
| `src/components/layout/LeftPanel.tsx` | Add `useState`, imports, state, button, modal render |
| `src/components/settings/SettingsModal.tsx` | Line 305: `60 * 60` → `90 * 60` |
| `src/components/timer/TimerSettings.tsx` | Line 23: `60 * 60` → `90 * 60` |

---

## Verification

1. Run `npm run dev:all`
2. **Pie chart:** Add a few tasks across columns → click the chart icon in the Task Board header → modal opens with correct counts and proportional slices; close with Escape or × button; remove all tasks → empty state renders
3. **Timer max:** Open Settings → Timer tab or click the Settings button next to the timer → Focus slider/input now goes up to 90; set to 90 → timer displays 1:30:00
