import { Hono } from 'hono'
import db from '../db.js'

const app = new Hono()

app.get('/:userName', (c) => {
  const userName = decodeURIComponent(c.req.param('userName'))
  const row = db
    .prepare(`SELECT daily_focus_mins FROM goals WHERE user_name = ?`)
    .get(userName) as { daily_focus_mins: number } | undefined

  return c.json({ userName, dailyFocusMins: row?.daily_focus_mins ?? 120 })
})

app.put('/:userName', async (c) => {
  const userName = decodeURIComponent(c.req.param('userName'))
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body.dailyFocusMins !== 'number') {
    return c.json({ error: 'dailyFocusMins (number) is required' }, 400)
  }

  db.prepare(`
    INSERT INTO goals (user_name, daily_focus_mins, updated_at)
    VALUES (?, ?, unixepoch() * 1000)
    ON CONFLICT(user_name) DO UPDATE SET
      daily_focus_mins = excluded.daily_focus_mins,
      updated_at = excluded.updated_at
  `).run(userName, body.dailyFocusMins)

  return c.json({ userName, dailyFocusMins: body.dailyFocusMins })
})

export default app
