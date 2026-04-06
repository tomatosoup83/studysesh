import { Hono } from 'hono'
import db from '../../db.js'
import { requireAuth } from '../../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

app.get('/', (c) => {
  const weekStart = c.req.query('weekStart')
  if (!weekStart) return c.json({ error: 'weekStart required' }, 400)
  const weekEnd = addDays(weekStart, 6)

  const rows = db.prepare(`
    SELECT
      u.id         AS user_id,
      u.display_name,
      bs.weekly_limit,
      COALESCE(SUM(bt.amount), 0) AS weekly_spent
    FROM users u
    JOIN budget_settings bs ON bs.user_id = u.id
    LEFT JOIN budget_transactions bt
      ON bt.user_id = u.id AND bt.date >= ? AND bt.date <= ?
    WHERE bs.leaderboard_visible = 1 AND bs.weekly_limit > 0
    GROUP BY u.id
  `).all(weekStart, weekEnd) as { user_id: string; display_name: string; weekly_limit: number; weekly_spent: number }[]

  const entries = rows
    .map((r) => ({
      displayName: r.display_name,
      weeklyLimit: r.weekly_limit,
      weeklySpent: r.weekly_spent,
      surplus: r.weekly_limit - r.weekly_spent,
      pctUnderBudget: ((r.weekly_limit - r.weekly_spent) / r.weekly_limit) * 100,
    }))
    .sort((a, b) => b.pctUnderBudget - a.pctUnderBudget)
    .map((entry, i) => ({ rank: i + 1, ...entry }))

  return c.json({ weekStart, weekEnd, entries })
})

export default app
