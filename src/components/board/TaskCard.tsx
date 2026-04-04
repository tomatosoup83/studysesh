import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Timer, ChevronRight } from 'lucide-react'
import { Task } from '../../types/task'
import { useTaskStore } from '../../stores/taskStore'
import { useTimerStore } from '../../stores/timerStore'
import { PriorityBadge } from './PriorityBadge'
import { TaskCardExpanded } from './TaskCardExpanded'

interface TaskCardProps {
  task: Task
  isDragOverlay?: boolean
}

export function TaskCard({ task, isDragOverlay = false }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { subjects } = useTaskStore()
  const { activeTaskId, setActiveTask } = useTimerStore()
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const subject = subjects.find((s) => s.id === task.subjectId)
  const completedSubs = task.subtasks.filter((s) => s.completed).length
  const isActive = activeTaskId === task.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          background: isActive ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'var(--color-surface)',
          border: `1px solid ${isActive ? 'color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'var(--color-border)'}`,
          boxShadow: isDragOverlay ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
          borderRadius: '8px',
          padding: '10px 12px',
          cursor: isDragOverlay ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
        {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
        onClick={() => { if (!isDragging) setExpanded(true) }}
        className="group transition-colors hover:border-[var(--color-primary)/30]"
      >
        <div className="flex items-start gap-2">
          <p
            className="flex-1 text-sm font-medium leading-snug min-w-0"
            style={{
              color: task.columnId === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textDecoration: task.columnId === 'completed' ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </p>
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
          <ChevronRight
            size={12}
            className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <PriorityBadge priority={task.priority} size="xs" />
          {subject && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: subject.color + '22', color: subject.color }}
            >
              {subject.name}
            </span>
          )}
          {task.subtasks.length > 0 && (
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {completedSubs}/{task.subtasks.length} ✓
            </span>
          )}
          {task.estimatedPomodoros != null && (
            <span
              className="flex items-center gap-0.5 text-[10px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Timer size={9} />
              {task.actualPomodoros}/{task.estimatedPomodoros}
            </span>
          )}
          {isActive && (
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-primary)' }}>
              ● Active
            </span>
          )}
        </div>
      </div>

      {expanded && <TaskCardExpanded task={task} onClose={() => setExpanded(false)} />}
    </>
  )
}
