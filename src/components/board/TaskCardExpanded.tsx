import { useState } from 'react'
import { Trash2, Timer, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Task } from '../../types/task'
import { useTaskStore } from '../../stores/taskStore'
import { useTimerStore } from '../../stores/timerStore'
import { PriorityBadge } from './PriorityBadge'
import { SubtaskList } from './SubtaskList'
import { Modal } from '../ui/Modal'

interface TaskCardExpandedProps {
  task: Task
  onClose: () => void
}

export function TaskCardExpanded({ task, onClose }: TaskCardExpandedProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [dueDate, setDueDate] = useState<string>(() =>
    task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : ''
  )
  const { updateTask, deleteTask, subjects } = useTaskStore()
  const { setActiveTask, activeTaskId } = useTimerStore()

  const subject = subjects.find((s) => s.id === task.subjectId)
  const isActiveTask = activeTaskId === task.id

  const handleClose = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      description: description.trim() || undefined,
      dueDate: dueDate ? parseISO(dueDate).getTime() : undefined,
    })
    onClose()
  }

  const handleDelete = () => {
    deleteTask(task.id)
    onClose()
  }

  return (
    <Modal open onClose={handleClose} title="Task Details" size="md">
      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm font-medium px-3 py-2 rounded-lg border outline-none"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {subject && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: subject.color + '22', color: subject.color }}
            >
              {subject.name}
            </span>
          )}
          {task.estimatedPomodoros && (
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <Timer size={11} />
              {task.actualPomodoros}/{task.estimatedPomodoros} 🍅
            </span>
          )}
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description..."
          rows={3}
          className="w-full text-sm px-3 py-2 rounded-lg border outline-none resize-none"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        <div className="flex items-center gap-2">
          <CalendarDays size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg border outline-none"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          {dueDate && (
            <button
              type="button"
              onClick={() => setDueDate('')}
              className="text-xs px-2 py-1 rounded"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Clear
            </button>
          )}
        </div>

        <SubtaskList taskId={task.id} subtasks={task.subtasks} />

        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={() => setActiveTask(isActiveTask ? null : task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: isActiveTask ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color: isActiveTask ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            <Timer size={12} />
            {isActiveTask ? 'Tracking' : 'Track with Timer'}
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
