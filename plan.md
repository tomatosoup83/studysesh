╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Plan to implement                                                                                                         │
│                                                                                                                           │
│ StudySesh — Implementation Plan                                                                                           │
│                                                                                                                           │
│ Context                                                                                                                   │
│                                                                                                                           │
│ Building a frontend-only study session tracker from scratch. The repo currently has only a README. The app is a           │
│ single-page, single-view layout with a Kanban task board (left) and Pomodoro timer + music player (right), tied together  │
│ by a command palette.                                                                                                     │
│                                                                                                                           │
│ ---                                                                                                                       │
│ Tech Stack                                                                                                                │
│                                                                                                                           │
│ ┌─────────────────┬──────────────────────────────────────────────────────┐                                                │
│ │     Concern     │                        Choice                        │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Framework       │ React 18 + TypeScript 5                              │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Build tool      │ Vite 5                                               │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Styling         │ Tailwind CSS 3 + CSS custom properties (for theming) │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ State           │ Zustand 4 with persist middleware → localStorage     │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Drag & drop     │ @dnd-kit/core + @dnd-kit/sortable                    │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Command palette │ cmdk                                                 │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ YouTube player  │ react-youtube (IFrame API wrapper)                   │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Ambient audio   │ Howler.js                                            │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Icons           │ lucide-react                                         │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ Dates           │ date-fns                                             │                                                │
│ ├─────────────────┼──────────────────────────────────────────────────────┤                                                │
│ │ IDs             │ nanoid                                               │                                                │
│ └─────────────────┴──────────────────────────────────────────────────────┘                                                │
│                                                                                                                           │
│ ---                                                                                                                       │
│ Project Structure                                                                                                         │
│                                                                                                                           │
│ src/                                                                                                                      │
│ ├── types/          # task.ts, timer.ts, music.ts, session.ts                                                             │
│ ├── stores/         # taskStore, timerStore, musicStore, sessionStore, settingsStore, commandStore                        │
│ ├── hooks/          # useTimer, useNotifications, useCommandActions, useKeyboardShortcut                                  │
│ ├── components/                                                                                                           │
│ │   ├── layout/     # LeftPanel, RightPanel                                                                               │
│ │   ├── header/     # Header, SessionStatsBar                                                                             │
│ │   ├── board/      # KanbanBoard, KanbanColumn, TaskCard, TaskCardExpanded, SubtaskList, AddTaskForm, PriorityBadge      │
│ │   ├── timer/      # PomodoroTimer, TimerDisplay, TimerControls, TimerSettings                                           │
│ │   ├── music/      # MusicPlayer, YouTubePlayer, YouTubeControls, AmbientMixer                                           │
│ │   ├── command/    # CommandPalette, CommandGroup, CommandItem                                                           │
│ │   ├── session/    # SessionSummaryModal                                                                                 │
│ │   └── ui/         # Modal, Slider, Tooltip, ThemeToggle                                                                 │
│ ├── lib/                                                                                                                  │
│ │   ├── ambientSounds.ts     # Howler instance registry (module-level Map)                                                │
│ │   ├── youtubePlaylist.ts   # Static lo-fi track array                                                                   │
│ │   ├── commands.ts          # CommandDefinition registry                                                                 │
│ │   ├── pomodoroLogic.ts     # Pure functions: next mode, session count                                                   │
│ │   └── storage.ts           # Persist config, localStorage keys                                                          │
│ └── styles/                                                                                                               │
│     ├── globals.css           # Tailwind directives                                                                       │
│     └── themes.css            # CSS custom props for light/dark/paper                                                     │
│                                                                                                                           │
│ ---                                                                                                                       │
│ State Architecture                                                                                                        │
│                                                                                                                           │
│ taskStore                                                                                                                 │
│                                                                                                                           │
│ tasks: Record<TaskId, Task>             // flat map for O(1) lookup                                                       │
│ taskOrder: Record<ColumnId, TaskId[]>   // ordered IDs per column — drives DnD                                            │
│ columns: ColumnId[]                     // ["not-started", "in-progress", "completed"]                                    │
│ subjects: Subject[]                                                                                                       │
│ Normalized shape is required for dnd-kit: SortableContext takes an ID array, updates go to the flat map.                  │
│                                                                                                                           │
│ timerStore                                                                                                                │
│                                                                                                                           │
│ mode: 'pomodoro' | 'short-break' | 'long-break'                                                                           │
│ status: 'idle' | 'running' | 'paused'                                                                                     │
│ secondsRemaining: number                                                                                                  │
│ pomodorosCompletedInSession: number                                                                                       │
│ activeTaskId: string | null                                                                                               │
│ tick() is the only action that mutates secondsRemaining. The useTimer hook owns setInterval and calls tick — timer logic  │
│ stays out of components. status is excluded from persist (always resets to idle on load).                                 │
│                                                                                                                           │
│ musicStore                                                                                                                │
│                                                                                                                           │
│ mode: 'youtube' | 'ambient'                                                                                               │
│ youtube: { isPlaying, currentTrackIndex, playlist, volume }                                                               │
│ ambient: Record<SoundId, { volume: number, playing: boolean }>                                                            │
│ YouTube playerRef excluded from persist (non-serializable DOM ref).                                                       │
│                                                                                                                           │
│ sessionStore                                                                                                              │
│                                                                                                                           │
│ startedAt: number | null                                                                                                  │
│ totalFocusSeconds: number                                                                                                 │
│ pomodorosCompleted: number                                                                                                │
│ tasksCompletedIds: string[]                                                                                               │
│ isActive: boolean                                                                                                         │
│ summary: SessionSummary | null   // non-null triggers modal                                                               │
│                                                                                                                           │
│ settingsStore                                                                                                             │
│                                                                                                                           │
│ theme: 'light' | 'dark' | 'paper'                                                                                         │
│ timerDurations: { pomodoro, shortBreak, longBreak }   // seconds                                                          │
│ notificationsEnabled: boolean                                                                                             │
│ autoStartBreaks: boolean                                                                                                  │
│ longBreakInterval: number                                                                                                 │
│                                                                                                                           │
│ commandStore                                                                                                              │
│                                                                                                                           │
│ open: boolean                  // excluded from persist                                                                   │
│ recentCommandIds: string[]     // capped at 5                                                                             │
│                                                                                                                           │
│ ---                                                                                                                       │
│ Key Implementation Details                                                                                                │
│                                                                                                                           │
│ Drag & Drop                                                                                                               │
│                                                                                                                           │
│ - DndContext at KanbanBoard level with PointerSensor + KeyboardSensor                                                     │
│ - Each column is a SortableContext with its taskOrder ID array                                                            │
│ - Cards use useSortable; empty columns use useDroppable                                                                   │
│ - DragOverlay renders a ghost card during cross-column drags (prevents layout collapse)                                   │
│ - onDragEnd: same column → arrayMove + reorderTask; different column → moveTask(id, toColumn, toIndex)                    │
│                                                                                                                           │
│ YouTube Player                                                                                                            │
│                                                                                                                           │
│ - Iframe rendered always in DOM, visually hidden (overflow-hidden h-0) — display:none pauses audio in some browsers       │
│ - onReady stores YT.Player instance in a useRef (not Zustand)                                                             │
│ - onStateChange fires ytNext when YT.PlayerState.ENDED                                                                    │
│ - Volume: playerRef.current.setVolume(0–100) (YouTube scale)                                                              │
│                                                                                                                           │
│ Ambient Audio                                                                                                             │
│                                                                                                                           │
│ - Module-level Map<SoundId, Howl> in ambientSounds.ts — instances created once, never recreated                           │
│ - AmbientMixer calls getSound(id).play()/.stop() on toggle, .volume(v) on slider change                                   │
│ - On app load: useEffect in AmbientMixer rehydrates play state + volume from musicStore to Howler instances               │
│ - Sound files in public/sounds/ (royalty-free MP3s)                                                                       │
│                                                                                                                           │
│ Command Palette                                                                                                           │
│                                                                                                                           │
│ - CommandDefinition: { id, label, category, hint, icon, action, keywords? }                                               │
│ - useCommandActions hook assembles commands at runtime with store actions injected into closures; dynamic labels (e.g.    │
│ current task name) built here                                                                                             │
│ - Recent commands: looked up from registry by ID, shown as a "Recent" group before categorized groups                     │
│ - useKeyboardShortcut sets global Cmd/Ctrl+K listener → commandStore.openPalette()                                        │
│                                                                                                                           │
│ Theme System                                                                                                              │
│                                                                                                                           │
│ - themes.css defines CSS custom properties per [data-theme] attribute on <html>                                           │
│ - ThemeProvider in App.tsx runs useEffect → document.documentElement.setAttribute('data-theme', theme)                    │
│ - Tailwind config maps utility classes (bg-primary, text-primary) to the CSS variables                                    │
│                                                                                                                           │
│ Timer                                                                                                                     │
│                                                                                                                           │
│ - useTimer: setInterval ref, fires every 1000ms when status === 'running', calls timerStore.tick()                        │
│ - When secondsRemaining hits 0: pomodoroLogic.getNextMode() determines next mode, notification fires, auto-advance checks │
│  settingsStore.autoStartBreaks                                                                                            │
│ - Timer ring: SVG circle with stroke-dashoffset driven by secondsRemaining / totalSeconds, CSS transition for smooth      │
│ animation                                                                                                                 │
│                                                                                                                           │
│ ---                                                                                                                       │
│ Implementation Phases                                                                                                     │
│                                                                                                                           │
│ 1. Scaffold — Vite init, install all deps, Tailwind config, types, Zustand stores shell, theme system, two-panel layout   │
│ 2. Task Board — taskStore actions, Kanban render, AddTaskForm, TaskCardExpanded + subtasks, PriorityBadge, dnd-kit        │
│ integration                                                                                                               │
│ 3. Pomodoro Timer — timerStore, useTimer, pomodoroLogic, TimerDisplay (SVG ring), controls, notifications                 │
│ 4. Music Player — YouTube hidden iframe + controls, ambient Howler registry + mixer, persist volume                       │
│ 5. Command Palette — command registry, useCommandActions, CommandPalette with cmdk, recent history                        │
│ 6. Session & Stats — sessionStore, session lifecycle, SessionSummaryModal, SessionStatsBar live stats                     │
│ 7. Polish — animations, empty states, keyboard accessibility, cross-browser (YouTube iframe differs in Safari)            │
│                                                                                                                           │
│ ---                                                                                                                       │
│ Verification                                                                                                              │
│                                                                                                                           │
│ - npm run dev → app loads, both panels visible, theme variables apply                                                     │
│ - Kanban: create task → drag between columns → subtasks toggle → persists on reload                                       │
│ - Timer: start → tick → mode cycles → browser notification fires → pomodoro count increments                              │
│ - Music: YouTube plays audio (no video feed) → next track on end; ambient sounds layer independently with separate        │
│ volumes                                                                                                                   │
│ - Command palette: Cmd+K opens → fuzzy search filters → arrow nav → Enter fires action → recent history updates           │
│ - End session → summary modal shows correct focus time, pomodoro count, tasks completed by subject                        |
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯