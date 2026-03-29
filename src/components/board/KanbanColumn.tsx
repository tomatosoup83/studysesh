import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { ColumnId, COLUMNS } from '../../types/task'
import { useTaskStore } from '../../stores/taskStore'
import { TaskCard } from './TaskCard'
import { AddTaskForm } from './AddTaskForm'

interface KanbanColumnProps {
  columnId: ColumnId
}

export function KanbanColumn({ columnId }: KanbanColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const { tasks, taskOrder } = useTaskStore()
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  const ids = taskOrder[columnId]
  const columnTasks = ids.map((id) => tasks[id]).filter(Boolean)
  const label = COLUMNS.find((c) => c.id === columnId)?.label ?? columnId

  const accentColor: Record<ColumnId, string> = {
    'not-started': 'var(--color-text-muted)',
    'in-progress': 'var(--color-primary)',
    'completed': 'var(--color-success)',
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        background: isOver ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
        border: `1px solid ${isOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
        transition: 'background 0.15s, border-color 0.15s',
        height: '100%',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: accentColor[columnId] }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}
          >
            {columnTasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-1 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-muted)' }}
          title="Add task"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {columnTasks.length === 0 && !showAddForm && (
          <div
            className="flex items-center justify-center h-16 rounded-lg text-xs border-2 border-dashed"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Drop tasks here
          </div>
        )}

        {showAddForm && (
          <div
            className="p-2 rounded-lg"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <AddTaskForm columnId={columnId} onClose={() => setShowAddForm(false)} />
          </div>
        )}
      </div>
    </div>
  )
}
