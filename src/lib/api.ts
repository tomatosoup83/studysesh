import type {
  PostSessionBody,
  PostSessionResponse,
  LeaderboardPeriod,
  LeaderboardResponse,
  UserSessionsResponse,
  GoalResponse,
  CsvDatesResponse,
  AuthResponse,
  MeResponse,
  QuotesResponse,
  QuoteItem,
  TaskItem,
  TasksResponse,
  SubjectItem,
} from '../types/api'

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('studysesh-auth')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  })
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

  auth: {
    login(loginName: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginName, password }),
      })
    },
    register(loginName: string, displayName: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginName, displayName, password }),
      })
    },
    me(): Promise<MeResponse> {
      return request<MeResponse>('/api/auth/me')
    },
    updateMe(updates: { displayName?: string; password?: string; avatarBase64?: string | null }): Promise<MeResponse> {
      return request<MeResponse>('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    },
  },

  tasks: {
    getAll(): Promise<TasksResponse> {
      return request<TasksResponse>('/api/tasks')
    },
    create(task: Partial<TaskItem> & { title: string }): Promise<TaskItem> {
      return request<TaskItem>('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
    },
    update(id: string, updates: Partial<TaskItem>): Promise<TaskItem> {
      return request<TaskItem>(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    },
    delete(id: string): Promise<void> {
      return request<void>(`/api/tasks/${id}`, { method: 'DELETE' })
    },
    updateOrder(taskIds: string[]): Promise<void> {
      return request<void>('/api/tasks/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      })
    },
    getSubjects(): Promise<{ subjects: SubjectItem[] }> {
      return request<{ subjects: SubjectItem[] }>('/api/tasks/subjects')
    },
    createSubject(id: string, name: string, color: string): Promise<SubjectItem> {
      return request<SubjectItem>('/api/tasks/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, color }),
      })
    },
    deleteSubject(id: string): Promise<void> {
      return request<void>(`/api/tasks/subjects/${id}`, { method: 'DELETE' })
    },
  },

  quotes: {
    getAll(): Promise<QuotesResponse> {
      return request<QuotesResponse>('/api/quotes')
    },
    add(text: string): Promise<QuoteItem> {
      return request<QuoteItem>('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
    },
  },
}
