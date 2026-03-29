import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Subtask } from '../../types/task'
import { useTaskStore } from '../../stores/taskStore'

interface SubtaskListProps {
  taskId: string
  subtasks: Subtask[]
}

export function SubtaskList({ taskId, subtasks }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('')
  const { addSubtask, toggleSubtask, deleteSubtask } = useTaskStore()

  const handleAdd = () => {
    if (newTitle.trim()) {
      addSubtask(taskId, newTitle.trim())
      setNewTitle('')
    }
  }

  const completed = subtasks.filter((s) => s.completed).length

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Subtasks ({completed}/{subtasks.length})
          </span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${subtasks.length ? (completed / subtasks.length) * 100 : 0}%`,
                background: 'var(--color-success)',
              }}
            />
          </div>
        </div>
      )}

      {subtasks.map((st) => (
        <div key={st.id} className="flex items-center gap-2 group">
          <input
            type="checkbox"
            checked={st.completed}
            onChange={() => toggleSubtask(taskId, st.id)}
            className="rounded cursor-pointer flex-shrink-0"
            style={{ accentColor: 'var(--color-primary)' }}
          />
          <span
            className={`flex-1 text-sm ${st.completed ? 'line-through' : ''}`}
            style={{ color: st.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
          >
            {st.title}
          </span>
          <button
            onClick={() => deleteSubtask(taskId, st.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add subtask..."
          className="flex-1 text-sm px-2 py-1 rounded border outline-none"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={handleAdd}
          className="p-1.5 rounded transition-colors"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
