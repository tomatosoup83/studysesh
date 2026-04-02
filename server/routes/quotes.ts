import { Hono } from 'hono'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const app = new Hono()

interface QuoteRow {
  id: number
  text: string
  added_by: string | null
  created_at: number
}

// GET /api/quotes — public
app.get('/', (c) => {
  const quotes = db.prepare('SELECT id, text, added_by, created_at FROM quotes ORDER BY created_at DESC').all() as QuoteRow[]
  return c.json({
    quotes: quotes.map(q => ({ id: q.id, text: q.text, addedBy: q.added_by, createdAt: q.created_at }))
  })
})

// POST /api/quotes — requires auth
app.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { text } = body
  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return c.json({ error: 'text must be at least 3 characters' }, 400)
  }

  // Get display name for added_by
  const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId) as { display_name: string } | undefined
  const addedBy = user?.display_name ?? null

  try {
    const result = db.prepare('INSERT INTO quotes (text, added_by) VALUES (?, ?)').run(text.trim(), addedBy)
    return c.json({ id: result.lastInsertRowid, text: text.trim(), addedBy, createdAt: Date.now() }, 201)
  } catch {
    return c.json({ error: 'Quote already exists' }, 409)
  }
})

export default app
