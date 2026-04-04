import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { arrayMove } from '@dnd-kit/sortable'
import { Task, TaskId, ColumnId, Subject, Priority, Subtask } from '../types/task'
import { api } from '../lib/api'
import { useSessionStore } from './sessionStore'
import { useTimerStore } from './timerStore'

interface TaskStore {
  tasks: Record<TaskId, Task>
  taskOrder: Record<ColumnId, TaskId[]>
  columns: ColumnId[]
  subjects: Subject[]
  addTask: (title: string, opts?: {
    columnId?: ColumnId
    subjectId?: string
    priority?: Priority
    description?: string
    estimatedPomodoros?: number
    dueDate?: number
  }) => TaskId
  updateTask: (id: TaskId, updates: Partial<Task>) => void
  deleteTask: (id: TaskId) => void
  moveTask: (id: TaskId, toColumn: ColumnId, toIndex?: number) => void
  reorderTask: (columnId: ColumnId, fromIndex: number, toIndex: number) => void
  addSubtask: (taskId: TaskId, title: string) => void
  toggleSubtask: (taskId: TaskId, subtaskId: string) => void
  deleteSubtask: (taskId: TaskId, subtaskId: string) => void
  addSubject: (name: string, color: string) => string
  deleteSubject: (id: string) => void
  incrementTaskPomodoro: (taskId: TaskId) => void
  syncFromServer: () => Promise<void>
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Math', color: '#6366f1' },
  { id: 'science', name: 'Science', color: '#10b981' },
  { id: 'english', name: 'English', color: '#f59e0b' },
  { id: 'history', name: 'History', color: '#ef4444' },
]

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: {},
      taskOrder: { 'not-started': [], 'in-progress': [], completed: [] },
      columns: ['not-started', 'in-progress', 'completed'] as ColumnId[],
      subjects: DEFAULT_SUBJECTS,

      syncFromServer: async () => {
        try {
          const { tasks: serverTasks, subjects: serverSubjects } = await api.tasks.getAll()
          const tasks: Record<TaskId, Task> = {}
          const taskOrder: Record<ColumnId, TaskId[]> = { 'not-started': [], 'in-progress': [], completed: [] }

          // Sort by sort_order then createdAt to preserve order
          const sorted = [...serverTasks].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt)
          for (const t of sorted) {
            const colId = t.columnId as ColumnId
            tasks[t.id] = {
              id: t.id,
              title: t.title,
              description: t.description ?? undefined,
              columnId: colId,
              priority: t.priority as Priority,
              subjectId: t.subjectId ?? undefined,
              subtasks: t.subtasks as Subtask[],
              estimatedPomodoros: t.estimatedPomodoros ?? undefined,
              actualPomodoros: t.actualPomodoros,
              createdAt: t.createdAt,
              completedAt: t.completedAt ?? undefined,
              dueDate: t.dueDate ?? undefined,
            }
            if (taskOrder[colId]) taskOrder[colId].push(t.id)
          }

          const subjects: Subject[] = serverSubjects.length > 0
            ? serverSubjects
            : DEFAULT_SUBJECTS

          set({ tasks, taskOrder, subjects })
        } catch {
          // Server sync failed, keep local state
        }
      },

      addTask: (title, opts = {}) => {
        const id = nanoid()
        const { columnId = 'not-started', subjectId, priority = 'medium', description, estimatedPomodoros, dueDate } = opts
        const task: Task = {
          id, title, description, columnId, priority,
          subjectId, subtasks: [], createdAt: Date.now(),
          estimatedPomodoros, actualPomodoros: 0, dueDate,
        }
        set((s) => ({
          tasks: { ...s.tasks, [id]: task },
          taskOrder: { ...s.taskOrder, [columnId]: [...s.taskOrder[columnId], id] },
        }))
        // Sync to server
        api.tasks.create({
          id,
          title,
          description,
          columnId,
          priority,
          subjectId,
          subtasks: [],
          estimatedPomodoros,
          actualPomodoros: 0,
          createdAt: task.createdAt,
          sortOrder: get().taskOrder[columnId].length,
          dueDate,
        }).catch(() => {
          // Rollback on failure
          set((s) => {
            const { [id]: _removed, ...rest } = s.tasks
            return {
              tasks: rest,
              taskOrder: { ...s.taskOrder, [columnId]: s.taskOrder[columnId].filter(tid => tid !== id) },
            }
          })
        })
        return id
      },

      updateTask: (id, updates) => {
        set((s) => ({ tasks: { ...s.tasks, [id]: { ...s.tasks[id], ...updates } } }))
        const { subtasks, ...rest } = updates as Task
        api.tasks.update(id, { ...rest, ...(subtasks !== undefined ? { subtasks } : {}) }).catch(() => {})
      },

      deleteTask: (id) => {
        const task = get().tasks[id]
        if (!task) return
        set((s) => {
          const { [id]: _removed, ...rest } = s.tasks
          return {
            tasks: rest,
            taskOrder: {
              ...s.taskOrder,
              [task.columnId]: s.taskOrder[task.columnId].filter((tid) => tid !== id),
            },
          }
        })
        api.tasks.delete(id).catch(() => {
          // Rollback on failure
          set((s) => ({
            tasks: { ...s.tasks, [id]: task },
            taskOrder: { ...s.taskOrder, [task.columnId]: [...s.taskOrder[task.columnId], id] },
          }))
        })
      },

      moveTask: (id, toColumn, toIndex) => {
        const task = get().tasks[id]
        if (!task) return
        const fromColumn = task.columnId
        const wasCompleted = fromColumn === 'completed'
        const completedAt = toColumn === 'completed' ? Date.now() : task.completedAt

        set((s) => {
          const fromOrder = s.taskOrder[fromColumn].filter((tid) => tid !== id)
          const toOrder = [...s.taskOrder[toColumn].filter((tid) => tid !== id)]
          const insertAt = toIndex !== undefined ? toIndex : toOrder.length
          toOrder.splice(insertAt, 0, id)
          return {
            tasks: {
              ...s.tasks,
              [id]: { ...task, columnId: toColumn, completedAt },
            },
            taskOrder: { ...s.taskOrder, [fromColumn]: fromOrder, [toColumn]: toOrder },
          }
        })

        // Notify session tracker when task is moved to completed
        if (toColumn === 'completed' && !wasCompleted) {
          const { isActive, addCompletedTask } = useSessionStore.getState()
          if (isActive) addCompletedTask(id)
        }

        // Clear active Pomodoro tracking if this task was being tracked
        if (toColumn === 'completed') {
          const { activeTaskId, setActiveTask } = useTimerStore.getState()
          if (activeTaskId === id) setActiveTask(null)
        }

        api.tasks.update(id, {
          columnId: toColumn,
          completedAt: completedAt ?? undefined,
        }).catch(() => {})
      },

      reorderTask: (columnId, fromIndex, toIndex) => {
        set((s) => ({
          taskOrder: {
            ...s.taskOrder,
            [columnId]: arrayMove(s.taskOrder[columnId], fromIndex, toIndex),
          },
        }))
        const newOrder = get().taskOrder[columnId]
        api.tasks.updateOrder(newOrder).catch(() => {})
      },

      addSubtask: (taskId, title) => {
        const task = get().tasks[taskId]
        if (!task) return
        const subtask: Subtask = { id: nanoid(), title, completed: false }
        const newSubtasks = [...task.subtasks, subtask]
        set((s) => ({ tasks: { ...s.tasks, [taskId]: { ...task, subtasks: newSubtasks } } }))
        api.tasks.update(taskId, { subtasks: newSubtasks }).catch(() => {})
      },

      toggleSubtask: (taskId, subtaskId) => {
        const task = get().tasks[taskId]
        if (!task) return
        const newSubtasks = task.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
        set((s) => ({ tasks: { ...s.tasks, [taskId]: { ...task, subtasks: newSubtasks } } }))
        api.tasks.update(taskId, { subtasks: newSubtasks }).catch(() => {})
      },

      deleteSubtask: (taskId, subtaskId) => {
        const task = get().tasks[taskId]
        if (!task) return
        const newSubtasks = task.subtasks.filter((st) => st.id !== subtaskId)
        set((s) => ({ tasks: { ...s.tasks, [taskId]: { ...task, subtasks: newSubtasks } } }))
        api.tasks.update(taskId, { subtasks: newSubtasks }).catch(() => {})
      },

      addSubject: (name, color) => {
        const id = nanoid()
        set((s) => ({ subjects: [...s.subjects, { id, name, color }] }))
        api.tasks.createSubject(id, name, color).catch(() => {})
        return id
      },

      deleteSubject: (id) => {
        set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) }))
        api.tasks.deleteSubject(id).catch(() => {})
      },

      incrementTaskPomodoro: (taskId) => {
        const task = get().tasks[taskId]
        if (!task) return
        const newCount = task.actualPomodoros + 1
        set((s) => ({ tasks: { ...s.tasks, [taskId]: { ...task, actualPomodoros: newCount } } }))
        api.tasks.update(taskId, { actualPomodoros: newCount }).catch(() => {})
      },
    }),
    { name: 'studysesh-tasks' }
  )
)
