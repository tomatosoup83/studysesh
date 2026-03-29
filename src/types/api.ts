export interface PostSessionBody {
  userName: string
  startedAt: number
  endedAt: number
  focusSecs: number
  idleSecs: number
  pomodoros: number
  tasksDone: number
  notes?: string
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
