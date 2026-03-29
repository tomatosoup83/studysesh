import { Hono } from 'hono'
import db from '../db.js'

const app = new Hono()

// GET /api/csv — list all dates with data
app.get('/', (c) => {
  const rows = db
    .prepare(`SELECT DISTINCT date FROM sessions ORDER BY date DESC`)
    .all() as { date: string }[]
  return c.json({ dates: rows.map((r) => r.date) })
})

// GET /api/csv/:date — download CSV for a day
app.get('/:date', (c) => {
  const date = c.req.param('date')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format, expected YYYY-MM-DD' }, 400)
  }

  const rows = db
    .prepare(
      `SELECT user_name, focus_secs, idle_secs, pomodoros, tasks_done, notes, ended_at
       FROM sessions WHERE date = ? ORDER BY ended_at ASC`
    )
    .all(date) as {
    user_name: string
    focus_secs: number
    idle_secs: number
    pomodoros: number
    tasks_done: number
    notes: string | null
    ended_at: number
  }[]

  if (rows.length === 0) {
    return c.json({ error: `No sessions found for ${date}` }, 404)
  }

  const escape = (v: string | null) =>
    v == null ? '' : `"${String(v).replace(/"/g, '""')}"`

  const header = 'Date,Name,Focus Time (min),Idle Time (min),Pomodoros,Tasks Completed,Notes'
  const lines = rows.map((r) =>
    [
      date,
      escape(r.user_name),
      Math.round(r.focus_secs / 60),
      Math.round(r.idle_secs / 60),
      r.pomodoros,
      r.tasks_done,
      escape(r.notes),
    ].join(',')
  )

  const csv = [header, ...lines].join('\n')

  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', `attachment; filename="studysesh-${date}.csv"`)
  return c.text(csv)
})

export default app
