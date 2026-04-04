import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isToday, format, addMonths, subMonths,
} from 'date-fns'
import { Modal } from '../ui/Modal'
import { TaskCardExpanded } from '../board/TaskCardExpanded'
import { useTaskStore } from '../../stores/taskStore'
import { useTaskModalStore } from '../../stores/taskModalStore'
import { Task } from '../../types/task'

interface Props {
  open: boolean
  onClose: () => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarModal({ open, onClose }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()))
  const [expandedTask, setExpandedTask] = useState<Task | null>(null)
  const { tasks, subjects } = useTaskStore()
  const { open: openAddModal } = useTaskModalStore()

  const allTasks = useMemo(() => Object.values(tasks), [tasks])

  const calDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 0 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
    })
  }, [currentMonth])

  const getTasksForDay = (day: Date) =>
    allTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const isCurrentMonth = (day: Date) =>
    day.getMonth() === currentMonth.getMonth()

  return (
    <>
      <Modal open={open} onClose={onClose} title="Calendar" size="xl">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)', background: 'var(--color-surface-3)' }}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium py-1" style={{ color: 'var(--color-text-muted)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="grid grid-cols-7 gap-px rounded-xl overflow-hidden"
          style={{ background: 'var(--color-border)' }}
        >
          {calDays.map((day) => {
            const dayTasks = getTasksForDay(day)
            const visible = dayTasks.slice(0, 3)
            const overflow = dayTasks.length - 3

            return (
              <div
                key={day.toISOString()}
                className="min-h-[80px] p-1.5 cursor-pointer transition-colors"
                style={{
                  background: 'var(--color-surface)',
                  opacity: isCurrentMonth(day) ? 1 : 0.4,
                }}
                onClick={() => openAddModal(day.getTime())}
              >
                {/* Day number */}
                <div className="flex justify-end mb-1">
                  <span
                    className="text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      background: isToday(day) ? 'var(--color-primary)' : 'transparent',
                      color: isToday(day) ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Task chips */}
                <div className="space-y-0.5">
                  {visible.map((task) => {
                    const subject = subjects.find((s) => s.id === task.subjectId)
                    return (
                      <button
                        key={task.id}
                        onClick={(e) => { e.stopPropagation(); setExpandedTask(task) }}
                        className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate leading-tight"
                        style={{
                          background: subject ? subject.color + '33' : 'var(--color-surface-3)',
                          color: subject ? subject.color : 'var(--color-text-secondary)',
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    )
                  })}
                  {overflow > 0 && (
                    <p className="text-[10px] pl-1" style={{ color: 'var(--color-text-muted)' }}>
                      +{overflow} more
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>

      {expandedTask && (
        <TaskCardExpanded task={expandedTask} onClose={() => setExpandedTask(null)} />
      )}
    </>
  )
}
