export interface PostSessionBody {
  userName: string
  startedAt: number
  endedAt: number
  focusSecs: number
  idleSecs: number
  pomodoros: number
  tasksDone: number
  notes?: string
  lastTaskName?: string | null
  shareLastTask?: boolean
}

export interface PostSessionResponse {
  id: number
  date: string
}

export interface LeaderboardEntry {
  rank: number
  userName: string
  totalFocusMins: number
  totalIdleMins: number
  totalPomodoros: number
  totalTasksDone: number
  sessionCount: number
  streak: number
  lastTaskName: string | null
  shareLastTask: boolean
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface LeaderboardResponse {
  period: LeaderboardPeriod
  rangeStart: string
  rangeEnd: string
  entries: LeaderboardEntry[]
}

export interface UserSession {
  id: number
  date: string
  focusSecs: number
  idleSecs: number
  pomodoros: number
  tasksDone: number
  notes: string | null
  endedAt: number
}

export interface UserSessionsResponse {
  sessions: UserSession[]
}

export interface GoalResponse {
  userName: string
  dailyFocusMins: number
}

export interface CsvDatesResponse {
  dates: string[]
}

export interface AuthUser {
  id: string
  loginName: string
  displayName: string
  avatarBase64: string | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface MeResponse {
  user: AuthUser
}

export interface QuoteItem {
  id: number
  text: string
  addedBy: string | null
  createdAt: number
}

export interface QuotesResponse {
  quotes: QuoteItem[]
}

export interface TaskItem {
  id: string
  title: string
  description: string | null
  columnId: string
  priority: string
  subjectId: string | null
  subtasks: SubtaskItem[]
  estimatedPomodoros: number | null
  actualPomodoros: number
  createdAt: number
  completedAt: number | null
  sortOrder: number
}

export interface SubtaskItem {
  id: string
  title: string
  completed: boolean
}

export interface SubjectItem {
  id: string
  name: string
  color: string
}

export interface TasksResponse {
  tasks: TaskItem[]
  subjects: SubjectItem[]
}
