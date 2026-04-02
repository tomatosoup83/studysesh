import { Hono } from 'hono'
import db from '../db.js'

const app = new Hono()

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

function getDateRange(period: Period, date: string): { rangeStart: string; rangeEnd: string } {
  const d = new Date(date + 'T00:00:00Z')

  if (period === 'daily') {
    return { rangeStart: date, rangeEnd: date }
  }

  if (period === 'weekly') {
    const day = d.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day // Monday start
    const mon = new Date(d)
    mon.setUTCDate(d.getUTCDate() + diff)
    const sun = new Date(mon)
    sun.setUTCDate(mon.getUTCDate() + 6)
    return {
      rangeStart: mon.toISOString().slice(0, 10),
      rangeEnd: sun.toISOString().slice(0, 10),
    }
  }

  if (period === 'monthly') {
    const year = d.getUTCFullYear()
    const month = d.getUTCMonth()
    const start = new Date(Date.UTC(year, month, 1))
    const end = new Date(Date.UTC(year, month + 1, 0))
    return {
      rangeStart: start.toISOString().slice(0, 10),
      rangeEnd: end.toISOString().slice(0, 10),
    }
  }

  // yearly
  const year = d.getUTCFullYear()
  return {
    rangeStart: `${year}-01-01`,
    rangeEnd: `${year}-12-31`,
  }
}

function computeStreaks(users: string[], today: string): Record<string, number> {
  const streaks: Record<string, number> = {}

  for (const user of users) {
    const rows = db
      .prepare(
        `SELECT DISTINCT date FROM sessions WHERE user_name = ? AND date <= ? ORDER BY date DESC`
      )
      .all(user, today) as { date: string }[]

    let streak = 0
    let cursor = today

    for (const row of rows) {
      if (row.date === cursor) {
        streak++
        const prev = new Date(cursor + 'T00:00:00Z')
        prev.setUTCDate(prev.getUTCDate() - 1)
        cursor = prev.toISOString().slice(0, 10)
      } else {
        break
      }
    }

    streaks[user] = streak
  }

  return streaks
}

app.get('/', (c) => {
  const period = (c.req.query('period') ?? 'daily') as Period
  const dateParam = c.req.query('date') ?? new Date().toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
    return c.json({ error: 'Invalid period' }, 400)
  }

  const { rangeStart, rangeEnd } = getDateRange(period, dateParam)

  const rows = db
    .prepare(
      `
      WITH agg AS (
        SELECT
          user_name,
          ROUND(SUM(focus_secs) / 60.0) AS totalFocusMins,
          ROUND(SUM(idle_secs)  / 60.0) AS totalIdleMins,
          SUM(pomodoros)                AS totalPomodoros,
          SUM(tasks_done)               AS totalTasksDone,
          COUNT(*)                      AS sessionCount
        FROM sessions
        WHERE date >= ? AND date <= ?
        GROUP BY user_name
      ),
      latest AS (
        SELECT user_name, last_task_name, share_last_task,
          ROW_NUMBER() OVER (PARTITION BY user_name ORDER BY ended_at DESC) AS rn
        FROM sessions
        WHERE date >= ? AND date <= ?
      )
      SELECT agg.*, latest.last_task_name, latest.share_last_task
      FROM agg
      LEFT JOIN latest ON latest.user_name = agg.user_name AND latest.rn = 1
      ORDER BY totalFocusMins DESC
    `
    )
    .all(rangeStart, rangeEnd, rangeStart, rangeEnd) as {
    user_name: string
    totalFocusMins: number
    totalIdleMins: number
    totalPomodoros: number
    totalTasksDone: number
    sessionCount: number
    last_task_name: string | null
    share_last_task: number
  }[]

  const users = rows.map((r) => r.user_name)
  const streaks = computeStreaks(users, today)

  const entries = rows.map((r, i) => ({
    rank: i + 1,
    userName: r.user_name,
    totalFocusMins: r.totalFocusMins,
    totalIdleMins: r.totalIdleMins,
    totalPomodoros: r.totalPomodoros,
    totalTasksDone: r.totalTasksDone,
    sessionCount: r.sessionCount,
    streak: streaks[r.user_name] ?? 0,
    lastTaskName: r.last_task_name,
    shareLastTask: r.share_last_task === 1,
  }))

  return c.json({ period, rangeStart, rangeEnd, entries })
})

export default app
