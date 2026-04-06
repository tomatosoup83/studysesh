import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import db from '../../db.js'
import { requireAuth } from '../../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

const DEFAULT_CATEGORIES = [
  { name: 'Food', color: '#10b981' },
  { name: 'Leisure', color: '#818cf8' },
  { name: 'Fees', color: '#f87171' },
]

app.get('/', (c) => {
  const userId = c.get('userId')
  const rows = db.prepare('SELECT id, name, color FROM budget_categories WHERE user_id = ? ORDER BY rowid ASC').all(userId) as { id: string; name: string; color: string }[]

  if (rows.length === 0) {
    // Seed defaults
    const insert = db.prepare('INSERT INTO budget_categories (id, user_id, name, color) VALUES (?, ?, ?, ?)')
    const seeded = DEFAULT_CATEGORIES.map((cat) => {
      const id = nanoid()
      insert.run(id, userId, cat.name, cat.color)
      return { id, name: cat.name, color: cat.color }
    })
    return c.json({ categories: seeded })
  }

  return c.json({ categories: rows })
})

app.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ id?: string; name: string; color: string }>()
  if (!body.name?.trim()) return c.json({ error: 'Name required' }, 400)

  const id = body.id ?? nanoid()
  db.prepare('INSERT OR REPLACE INTO budget_categories (id, user_id, name, color) VALUES (?, ?, ?, ?)').run(id, userId, body.name.trim(), body.color)
  return c.json({ id, name: body.name.trim(), color: body.color }, 201)
})

app.delete('/:id', (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const row = db.prepare('SELECT id FROM budget_categories WHERE id = ? AND user_id = ?').get(id, userId)
  if (!row) return c.json({ error: 'Not found' }, 404)
  db.prepare('DELETE FROM budget_categories WHERE id = ?').run(id)
  return c.json({ ok: true })
})

export default app
