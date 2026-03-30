import { useState } from 'react'
import { Flag, BookOpen, Inbox, Timer } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useTaskModalStore } from '../../stores/taskModalStore'
import { useTaskStore } from '../../stores/taskStore'
import { COLUMNS, ColumnId, Priority } from '../../types/task'

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high',   label: 'P1 — High',   color: '#ef4444' },
  { value: 'medium', label: 'P2 — Medium',  color: '#f59e0b' },
  { value: 'low',    label: 'P3 — Low',     color: '#94a3b8' },
]

export function AddTaskModal() {
  const { isOpen, close } = useTaskModalStore()
  const { addTask, subjects } = useTaskStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [subjectId, setSubjectId] = useState<string>('')
  const [columnId, setColumnId] = useState<ColumnId>('not-started')
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false)
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1)

  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const [showSubjectMenu, setShowSubjectMenu] = useState(false)
  const [showColumnMenu, setShowColumnMenu] = useState(false)

  const reset = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setSubjectId('')
    setColumnId('not-started')
    setPomodoroEnabled(false)
    setEstimatedPomodoros(1)
    setShowPriorityMenu(false)
    setShowSubjectMenu(false)
    setShowColumnMenu(false)
  }

  const handleClose = () => { reset(); close() }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask(title.trim(), {
      description: description.trim() || undefined,
      priority,
      subjectId: subjectId || undefined,
      columnId,
      estimatedPomodoros: pomodoroEnabled ? estimatedPomodoros : undefined,
    })
    handleClose()
  }

  const selectedPriority = PRIORITIES.find((p) => p.value === priority)!
  const selectedColumn = COLUMNS.find((c) => c.id === columnId)!
  const selectedSubject = subjects.find((s) => s.id === subjectId)

  return (
    <Modal open={isOpen} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-0">
        {/* Title */}
        <input
          autoFocus
          type="text"
          placeholder="Task name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-semibold outline-none bg-transparent mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        />

        {/* Description */}
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full text-sm outline-none bg-transparent resize-none mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        />

        {/* Pill buttons row */}
        <div className="flex flex-wrap gap-2 mb-4 relative">

          {/* Priority */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowPriorityMenu((v) => !v); setShowSubjectMenu(false); setShowColumnMenu(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: selectedPriority.color, background: 'var(--color-surface-2)' }}
            >
              <Flag size={12} />
              {selectedPriority.label}
            </button>
            {showPriorityMenu && (
              <div
                className="absolute top-full left-0 mt-1 z-10 rounded-lg shadow-lg overflow-hidden min-w-[140px]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPriority(p.value); setShowPriorityMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors"
                    style={{
                      color: p.color,
                      background: priority === p.value ? 'var(--color-surface-2)' : 'transparent',
                    }}
                  >
                    <Flag size={11} />
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowSubjectMenu((v) => !v); setShowPriorityMenu(false); setShowColumnMenu(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-2)' }}
            >
              <BookOpen size={12} style={{ color: selectedSubject?.color }} />
              {selectedSubject ? selectedSubject.name : 'Subject'}
            </button>
            {showSubjectMenu && (
              <div
                className="absolute top-full left-0 mt-1 z-10 rounded-lg shadow-lg overflow-hidden min-w-[140px]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <button
                  type="button"
                  onClick={() => { setSubjectId(''); setShowSubjectMenu(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                  style={{ color: 'var(--color-text-muted)', background: !subjectId ? 'var(--color-surface-2)' : 'transparent' }}
                >
                  None
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSubjectId(s.id); setShowSubjectMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                    style={{
                      color: 'var(--color-text-primary)',
                      background: subjectId === s.id ? 'var(--color-surface-2)' : 'transparent',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pomodoro toggle */}
          <button
            type="button"
            onClick={() => setPomodoroEnabled((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              borderColor: pomodoroEnabled ? 'var(--color-accent)' : 'var(--color-border)',
              color: pomodoroEnabled ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              background: 'var(--color-surface-2)',
            }}
          >
            <Timer size={12} />
            {pomodoroEnabled ? (
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={estimatedPomodoros}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEstimatedPomodoros(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-8 text-center outline-none bg-transparent"
                  style={{ color: 'var(--color-accent)' }}
                />
                🍅
              </span>
            ) : 'Pomodoros'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', margin: '0 -16px' }} />

        {/* Footer */}
        <div className="flex items-center justify-between pt-3">
          {/* Column selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowColumnMenu((v) => !v); setShowPriorityMenu(false); setShowSubjectMenu(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-2)' }}
            >
              <Inbox size={12} />
              {selectedColumn.label}
              <span style={{ color: 'var(--color-text-muted)' }}>▾</span>
            </button>
            {showColumnMenu && (
              <div
                className="absolute bottom-full left-0 mb-1 z-10 rounded-lg shadow-lg overflow-hidden min-w-[140px]"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {COLUMNS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => { setColumnId(col.id); setShowColumnMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                    style={{
                      color: 'var(--color-text-primary)',
                      background: columnId === col.id ? 'var(--color-surface-2)' : 'transparent',
                    }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              Add task
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
