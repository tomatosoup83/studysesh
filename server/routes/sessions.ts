import { Hono } from 'hono'
import db from '../db.js'

const app = new Hono()

app.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { userName, startedAt, endedAt, focusSecs, idleSecs, pomodoros, tasksDone, notes } = body

  if (!userName || typeof userName !== 'string' || userName.trim() === '') {
    return c.json({ error: 'userName is required' }, 400)
  }
  if (!startedAt || !endedAt || endedAt <= startedAt) {
    return c.json({ error: 'Invalid startedAt/endedAt' }, 400)
  }

  const date = new Date(endedAt).toISOString().slice(0, 10)

  const stmt = db.prepare(`
    INSERT INTO sessions (user_name, date, started_at, ended_at, focus_secs, idle_secs, pomodoros, tasks_done, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    userName.trim(),
    date,
    startedAt,
    endedAt,
    focusSecs ?? 0,
    idleSecs ?? 0,
    pomodoros ?? 0,
    tasksDone ?? 0,
    notes ?? null
  )

  return c.json({ id: result.lastInsertRowid, date }, 201)
})

app.get('/:userName', (c) => {
  const userName = decodeURIComponent(c.req.param('userName'))
  const limit = Math.min(parseInt(c.req.query('limit') ?? '30', 10), 100)

  const rows = db
    .prepare(
      `SELECT id, date, focus_secs, idle_secs, pomodoros, tasks_done, notes, ended_at
       FROM sessions WHERE user_name = ? ORDER BY ended_at DESC LIMIT ?`
    )
    .all(userName, limit) as {
    id: number
    date: string
    focus_secs: number
    idle_secs: number
    pomodoros: number
    tasks_done: number
    notes: string | null
    ended_at: number
  }[]

  return c.json({
    sessions: rows.map((r) => ({
      id: r.id,
      date: r.date,
      focusSecs: r.focus_secs,
      idleSecs: r.idle_secs,
      pomodoros: r.pomodoros,
      tasksDone: r.tasks_done,
      notes: r.notes,
      endedAt: r.ended_at,
    })),
  })
})

export default app
