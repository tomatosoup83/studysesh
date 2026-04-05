export type ColumnId = 'not-started' | 'in-progress' | 'completed'
export type TaskId = string
export type Priority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: TaskId
  title: string
  description?: string
  columnId: ColumnId
  priority: Priority
  subjectId?: string
  subtasks: Subtask[]
  createdAt: number
  completedAt?: number
  dueDate?: number
  estimatedPomodoros?: number
  actualPomodoros: number
  mode?: 'study' | 'personal'
}

export interface Subject {
  id: string
  name: string
  color: string
}

export const COLUMNS: { id: ColumnId; label: string }[] = [
  { id: 'not-started', label: 'Not Started' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]
