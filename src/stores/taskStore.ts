import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { arrayMove } from '@dnd-kit/sortable'
import { Task, TaskId, ColumnId, Subject, Priority, Subtask } from '../types/task'

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
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Math', color: '#6366f1' },
  { id: 'science', name: 'Science', color: '#10b981' },
  { id: 'english', name: 'English', color: '#f59e0b' },
  { id: 'history', name: 'History', color: '#ef4444' },
]

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: {},
      taskOrder: { 'not-started': [], 'in-progress': [], completed: [] },
      columns: ['not-started', 'in-progress', 'completed'],
      subjects: DEFAULT_SUBJECTS,

      addTask: (title, opts = {}) => {
        const id = nanoid()
        const { columnId = 'not-started', subjectId, priority = 'medium', description, estimatedPomodoros } = opts
        const task: Task = {
          id, title, description, columnId, priority,
          subjectId, subtasks: [], createdAt: Date.now(),
          estimatedPomodoros, actualPomodoros: 0,
        }
        set((s) => ({
          tasks: { ...s.tasks, [id]: task },
          taskOrder: { ...s.taskOrder, [columnId]: [...s.taskOrder[columnId], id] },
        }))
        return id
      },

      updateTask: (id, updates) =>
        set((s) => ({ tasks: { ...s.tasks, [id]: { ...s.tasks[id], ...updates } } })),

      deleteTask: (id) =>
        set((s) => {
          const task = s.tasks[id]
          if (!task) return s
          const { [id]: _removed, ...rest } = s.tasks
          return {
            tasks: rest,
            taskOrder: {
              ...s.taskOrder,
              [task.columnId]: s.taskOrder[task.columnId].filter((tid) => tid !== id),
            },
          }
        }),

      moveTask: (id, toColumn, toIndex) =>
        set((s) => {
          const task = s.tasks[id]
          if (!task) return s
          const fromColumn = task.columnId
          const fromOrder = s.taskOrder[fromColumn].filter((tid) => tid !== id)
          const toOrder = [...s.taskOrder[toColumn].filter((tid) => tid !== id)]
          const insertAt = toIndex !== undefined ? toIndex : toOrder.length
          toOrder.splice(insertAt, 0, id)
          return {
            tasks: {
              ...s.tasks,
              [id]: {
                ...task,
                columnId: toColumn,
                completedAt: toColumn === 'completed' ? Date.now() : task.completedAt,
              },
            },
            taskOrder: { ...s.taskOrder, [fromColumn]: fromOrder, [toColumn]: toOrder },
          }
        }),

      reorderTask: (columnId, fromIndex, toIndex) =>
        set((s) => ({
          taskOrder: {
            ...s.taskOrder,
            [columnId]: arrayMove(s.taskOrder[columnId], fromIndex, toIndex),
          },
        })),

      addSubtask: (taskId, title) =>
        set((s) => {
          const task = s.tasks[taskId]
          if (!task) return s
          const subtask: Subtask = { id: nanoid(), title, completed: false }
          return { tasks: { ...s.tasks, [taskId]: { ...task, subtasks: [...task.subtasks, subtask] } } }
        }),

      toggleSubtask: (taskId, subtaskId) =>
        set((s) => {
          const task = s.tasks[taskId]
          if (!task) return s
          return {
            tasks: {
              ...s.tasks,
              [taskId]: {
                ...task,
                subtasks: task.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, completed: !st.completed } : st
                ),
              },
            },
          }
        }),

      deleteSubtask: (taskId, subtaskId) =>
        set((s) => {
          const task = s.tasks[taskId]
          if (!task) return s
          return {
            tasks: {
              ...s.tasks,
              [taskId]: { ...task, subtasks: task.subtasks.filter((st) => st.id !== subtaskId) },
            },
          }
        }),

      addSubject: (name, color) => {
        const id = nanoid()
        set((s) => ({ subjects: [...s.subjects, { id, name, color }] }))
        return id
      },

      deleteSubject: (id) =>
        set((s) => ({ subjects: s.subjects.filter((sub) => sub.id !== id) })),

      incrementTaskPomodoro: (taskId) =>
        set((s) => {
          const task = s.tasks[taskId]
          if (!task) return s
          return { tasks: { ...s.tasks, [taskId]: { ...task, actualPomodoros: task.actualPomodoros + 1 } } }
        }),
    }),
    { name: 'studysesh-tasks' }
  )
)
