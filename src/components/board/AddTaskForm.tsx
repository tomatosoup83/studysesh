import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTaskStore } from '../../stores/taskStore'
import { ColumnId, Priority } from '../../types/task'

interface AddTaskFormProps {
  columnId?: ColumnId
  onClose?: () => void
}

export function AddTaskForm({ columnId = 'not-started', onClose }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [subjectId, setSubjectId] = useState('')
  const [estimatedPomodoros, setEstimatedPomodoros] = useState('')
  const { addTask, subjects } = useTaskStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    addTask(title.trim(), {
      columnId,
      priority,
      subjectId: subjectId || undefined,
      estimatedPomodoros: estimatedPomodoros ? Number(estimatedPomodoros) : undefined,
    })
    setTitle('')
    setEstimatedPomodoros('')
    onClose?.()
  }

  const inputStyle = {
    background: 'var(--color-surface-2)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
        style={{ ...inputStyle, borderColor: 'var(--color-primary)' }}
      />
      <div className="flex gap-1.5">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
          style={inputStyle}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
          style={inputStyle}
        >
          <option value="">No Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={estimatedPomodoros}
          onChange={(e) => setEstimatedPomodoros(e.target.value)}
          placeholder="🍅"
          min="1"
          max="20"
          className="w-12 text-xs px-2 py-1.5 rounded-lg border outline-none text-center"
          style={inputStyle}
        />
      </div>
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={13} /> Add Task
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </form>
  )
}
