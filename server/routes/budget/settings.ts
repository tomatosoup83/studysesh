import { Hono } from 'hono'
import db from '../../db.js'
import { requireAuth } from '../../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

function getOrCreateSettings(userId: string) {
  const row = db.prepare('SELECT weekly_limit, leaderboard_visible FROM budget_settings WHERE user_id = ?').get(userId) as { weekly_limit: number; leaderboard_visible: number } | undefined
  if (!row) {
    db.prepare('INSERT INTO budget_settings (user_id, weekly_limit, leaderboard_visible) VALUES (?, 0, 1)').run(userId)
    return { weeklyLimit: 0, leaderboardVisible: true }
  }
  return { weeklyLimit: row.weekly_limit, leaderboardVisible: row.leaderboard_visible === 1 }
}

app.get('/', (c) => {
  const userId = c.get('userId')
  return c.json(getOrCreateSettings(userId))
})

app.put('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ weeklyLimit?: number; leaderboardVisible?: boolean }>()

  // Ensure row exists
  getOrCreateSettings(userId)

  const updates: string[] = []
  const values: unknown[] = []

  if (body.weeklyLimit !== undefined) {
    updates.push('weekly_limit = ?')
    values.push(body.weeklyLimit)
  }
  if (body.leaderboardVisible !== undefined) {
    updates.push('leaderboard_visible = ?')
    values.push(body.leaderboardVisible ? 1 : 0)
  }
  if (updates.length > 0) {
    updates.push('updated_at = ?')
    values.push(Date.now())
    db.prepare(`UPDATE budget_settings SET ${updates.join(', ')} WHERE user_id = ?`).run(...values, userId)
  }

  return c.json(getOrCreateSettings(userId))
})

export default app
