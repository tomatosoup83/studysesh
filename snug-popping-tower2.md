# StudySesh — Fixes, QoL, and Mobile UI

## Context
A batch of bug fixes, quality-of-life improvements, and a full mobile-responsive UI for the studysesh app.

---

## Fix 1: Idle/Focus timers continue when tab is hidden

**Problem:** `src/hooks/useIdleTimer.ts` uses a plain 1-second `setInterval`. Browsers throttle intervals in background tabs, so idle time under-counts when the user switches away.

**Fix:** Use wall-clock timestamps instead of incrementing by 1 per tick. Track when idle started; on each tick (and on `visibilitychange`), compute the true elapsed idle delta with `Date.now()`.

**Changes to `src/hooks/useIdleTimer.ts`:**
```ts
export function useIdleTimer() {
  useEffect(() => {
    let idleStartMs: number | null = null

    const tick = () => {
      const { isActive, addIdleTime } = useSessionStore.getState()
      const { status } = useTimerStore.getState()
      const now = Date.now()

      if (isActive && status !== 'running') {
        if (idleStartMs === null) idleStartMs = now
        const delta = Math.floor((now - idleStartMs) / 1000)
        if (delta > 0) {
          addIdleTime(delta)
          idleStartMs = now
        }
      } else {
        idleStartMs = null  // reset when timer runs or session stops
      }
    }

    const interval = setInterval(tick, 1000)
    const onVisibility = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
```

Focus time is already handled by `useTimer.ts`'s `creditedSecsRef` wall-clock approach — no change needed there.

---

## Fix 2: Timer settings close no longer resets running timer

**Problem:** `src/components/timer/TimerSettings.tsx` line 13: `handleClose` unconditionally calls `reset(timerDurations)`, which sets `status: 'idle'` even if the timer is running.

**Fix:** Only reset if the timer is not currently running.

```ts
// TimerSettings.tsx
const { reset, status } = useTimerStore()

const handleClose = () => {
  setOpen(false)
  if (status !== 'running') reset(timerDurations)
}
```

---

## QoL 1: Browser tab title shows active timer

**Change in `src/App.tsx`:** Add a `useEffect` that updates `document.title` based on timer state.

```ts
const { secondsRemaining, status, mode } = useTimerStore()

useEffect(() => {
  if (status === 'running' || status === 'paused') {
    const mins = String(Math.floor(secondsRemaining / 60)).padStart(2, '0')
    const secs = String(secondsRemaining % 60).padStart(2, '0')
    const label = mode === 'pomodoro' ? 'Focus' : mode === 'short-break' ? 'Short Break' : 'Long Break'
    document.title = `${mins}:${secs} — ${label}`
  } else {
    document.title = 'StudySesh'
  }
}, [secondsRemaining, status, mode])
```

---

## QoL 2: Gap between panels

**Problem:** `src/App.tsx` main container has `style={{ gap: 0 }}` overriding Tailwind, so the left and right panels are flush against each other.

**Fix:** Change `style={{ gap: 0 }}` to `gap` prop `gap-3` in the `className` and remove the inline style override. Also add `gap-2` between the ResizeHandle and panels visually.

Specifically in `App.tsx` main element:
- Remove `style={{ gap: 0 }}` from `<main>`
- Add `gap-2` to `<main>`'s className

This gives a consistent 8px gap between LeftPanel, ResizeHandle, and RightPanel — matching the `p-3` padding already on the main container.

---

## QoL 3: "Track with Pomodoro" button on each card

**Problem:** The only way to track a task with the Pomodoro timer is via the expanded modal. Users want a quick button on the card.

**Changes to `src/components/board/TaskCard.tsx`:**
- Import `setActiveTask` from `useTimerStore`
- On non-completed cards, show a small `<Timer>` icon button on hover (using `group-hover:opacity-100`)
- Button is `e.stopPropagation()` to prevent opening the expanded modal
- Toggles: `setActiveTask(isActive ? null : task.id)`

Place the button in the top-right area of the card alongside the existing `ChevronRight` icon (replace `ChevronRight` with a row of `[Timer button | ChevronRight]`, both shown on hover).

```tsx
// Add in the flex row at the top of the card:
{task.columnId !== 'completed' && (
  <button
    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
    style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
    onClick={(e) => { e.stopPropagation(); setActiveTask(isActive ? null : task.id) }}
    title={isActive ? 'Stop tracking' : 'Track with Pomodoro'}
  >
    <Timer size={12} />
  </button>
)}
```

---

## QoL 4: Auto-clear tracking when task is moved to completed

**Changes to `src/stores/taskStore.ts` `moveTask()` function:**

After the `if (toColumn === 'completed' && !wasCompleted)` block (around line 173), add:

```ts
// Clear active tracking if this task was being tracked
if (toColumn === 'completed') {
  const { activeTaskId, setActiveTask } = useTimerStore.getState()
  if (activeTaskId === id) setActiveTask(null)
}
```

`useTimerStore` is already imported in taskStore (check — if not, add the import).

---

## QoL 5: Remove redundant scrollbar in music player

**Problem:** `src/components/music/MusicPlayer.tsx` line 32 wraps `<YouTubeControls>` in `overflow-y-auto`, while `YouTubeControls.tsx` line 63 already has its own `max-h-32 overflow-y-auto` for the playlist list. This creates two scrollbars.

**Fix in `src/components/music/MusicPlayer.tsx`:** Change the outer wrapper from `overflow-y-auto` to `overflow-hidden`:

```tsx
// line 32: was "flex-1 overflow-y-auto min-h-0"
<div className="flex-1 overflow-hidden min-h-0">
```

The inner `YouTubeControls` playlist div already handles its own scroll.

---

## Big Change: Mobile-Responsive UI

### Approach
- Detect mobile with a `useIsMobile` hook (`window.innerWidth < 768`, reacts to resize)
- In `App.tsx`, conditionally render `<MobileLayout>` vs the current desktop layout
- Create `src/components/layout/MobileLayout.tsx` with bottom nav + tab switching
- Desktop layout is completely unchanged

### `src/hooks/useIsMobile.ts` (new file)
```ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}
```

### `src/components/layout/MobileLayout.tsx` (new file)
4 tabs: `timer` | `session` | `tasks` | `profile`

```tsx
type MobileTab = 'timer' | 'session' | 'tasks' | 'profile'

export function MobileLayout() {
  const [tab, setTab] = useState<MobileTab>('timer')

  return (
    <div className="flex flex-col" style={{ height: '100dvh', background: 'var(--color-bg)', overflow: 'hidden' }}>
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden p-2">
        {tab === 'timer'   && <RightPanel />}
        {tab === 'session' && <SessionTracker />}
        {tab === 'tasks'   && <KanbanBoard />}
        {tab === 'profile' && <MobileProfileTab />}
      </main>
      <MobileBottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
```

**Timer tab:** Renders `<RightPanel />` directly — same Pomodoro timer + music player.

**Session tab:** Renders `<SessionTracker />` directly — all stat boxes stacked vertically (they already stack since SessionTracker is a flex-column layout).

**Tasks tab:** Renders `<KanbanBoard />` — columns on mobile will be vertically stacked. This requires a small CSS change: on mobile the kanban columns should stack vertically instead of horizontally. Add a prop or context to `KanbanBoard` so it uses `flex-col` instead of `flex-row` when `isMobile`.

**Profile tab `<MobileProfileTab />`:** A simple panel with two buttons: "Settings" (opens SettingsModal) and "Profile" (opens ProfileModal). Render the modals inline.

### `<MobileBottomNav>` component (in MobileLayout.tsx or separate file)
4 icon buttons: `Timer` (Clock icon), `Session` (BarChart2), `Tasks` (CheckSquare), `Profile` (User). Highlight active tab with primary color. Fixed at bottom, background `var(--color-panel-bg)`, border-top.

### KanbanBoard mobile column stacking
In `src/components/board/KanbanBoard.tsx`: Accept an `isMobile` prop (passed from MobileLayout) or use `useIsMobile()` directly. When mobile, use `flex-col` on the columns container instead of `flex-row`, and set each column to full width.

### App.tsx integration
```tsx
const isMobile = useIsMobile()

return isMobile ? <MobileLayout /> : (
  // existing desktop layout
)
```

---

## Critical Files
- `src/hooks/useIdleTimer.ts` — wall-clock idle tracking
- `src/components/timer/TimerSettings.tsx` — don't reset running timer on close
- `src/App.tsx` — tab title effect + gap fix + mobile routing
- `src/components/board/TaskCard.tsx` — inline track button
- `src/stores/taskStore.ts` — auto-clear tracking on complete
- `src/components/music/MusicPlayer.tsx` — remove outer overflow-y-auto
- `src/hooks/useIsMobile.ts` — new hook
- `src/components/layout/MobileLayout.tsx` — new mobile layout
- `src/components/board/KanbanBoard.tsx` — mobile column stacking

---

## Verification
1. **Idle timer:** Start session, leave timer paused, switch tabs for 30s, return — idle count incremented correctly
2. **Timer settings:** Start timer, open settings, change a value, close settings — timer continues from where it was
3. **Tab title:** Start timer → tab title shows "MM:SS — Focus" and updates every second
4. **Gap:** Desktop view shows a visible gap between left and right panels
5. **Track button:** Hover over any non-completed task card → timer icon appears → click it → card shows "Active" badge → timer shows task name
6. **Auto-complete:** Set a task as active, drag it to Completed → timer tracking clears
7. **Music scrollbar:** Only one scrollbar visible in the playlist area
8. **Mobile:** Resize browser to <768px (or use DevTools) → bottom nav appears with 4 tabs → each tab shows correct content → all functionality works
