import type {
  PostSessionBody,
  PostSessionResponse,
  LeaderboardPeriod,
  LeaderboardResponse,
  UserSessionsResponse,
  GoalResponse,
  CsvDatesResponse,
} from '../types/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  postSession(body: PostSessionBody): Promise<PostSessionResponse> {
    return request<PostSessionResponse>('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  },

  getLeaderboard(period: LeaderboardPeriod, date?: string): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({ period })
    if (date) params.set('date', date)
    return request<LeaderboardResponse>(`/api/leaderboard?${params}`)
  },

  getUserSessions(userName: string, limit = 30): Promise<UserSessionsResponse> {
    return request<UserSessionsResponse>(
      `/api/sessions/${encodeURIComponent(userName)}?limit=${limit}`
    )
  },

  getCsvUrl(date: string): string {
    return `/api/csv/${date}`
  },

  getCsvDates(): Promise<CsvDatesResponse> {
    return request<CsvDatesResponse>('/api/csv')
  },

  getGoal(userName: string): Promise<GoalResponse> {
    return request<GoalResponse>(`/api/goals/${encodeURIComponent(userName)}`)
  },

  setGoal(userName: string, dailyFocusMins: number): Promise<GoalResponse> {
    return request<GoalResponse>(`/api/goals/${encodeURIComponent(userName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyFocusMins }),
    })
  },
}
