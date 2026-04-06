import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import db from '../../db.js'
import { requireAuth } from '../../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

interface TxRow {
  id: string
  user_id: string
  date: string
  name: string
  amount: number
  category_id: string | null
  notes: string | null
  created_at: number
}

function txToJson(r: TxRow) {
  return {
    id: r.id,
    date: r.date,
    name: r.name,
    amount: r.amount,
    categoryId: r.category_id,
    notes: r.notes,
    createdAt: r.created_at,
  }
}

// Add 6 days to YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

app.get('/', (c) => {
  const userId = c.get('userId')
  const weekStart = c.req.query('weekStart')
  if (!weekStart) return c.json({ error: 'weekStart required' }, 400)

  const weekEnd = addDays(weekStart, 6)
  const rows = db.prepare(
    'SELECT * FROM budget_transactions WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date ASC, created_at ASC'
  ).all(userId, weekStart, weekEnd) as TxRow[]

  return c.json({ transactions: rows.map(txToJson), weekStart, weekEnd })
})

app.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ id?: string; date: string; name: string; amount: number; categoryId?: string | null; notes?: string | null }>()

  if (!body.name?.trim()) return c.json({ error: 'Name required' }, 400)
  if (body.amount == null || isNaN(body.amount)) return c.json({ error: 'Amount required' }, 400)

  const id = body.id ?? nanoid()
  db.prepare(
    'INSERT INTO budget_transactions (id, user_id, date, name, amount, category_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, userId, body.date, body.name.trim(), body.amount, body.categoryId ?? null, body.notes?.trim() ?? null)

  const row = db.prepare('SELECT * FROM budget_transactions WHERE id = ?').get(id) as TxRow
  return c.json(txToJson(row), 201)
})

app.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const txId = c.req.param('id')
  const row = db.prepare('SELECT id FROM budget_transactions WHERE id = ? AND user_id = ?').get(txId, userId)
  if (!row) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const fieldMap: Record<string, string> = {
    date: 'date',
    name: 'name',
    amount: 'amount',
    categoryId: 'category_id',
    notes: 'notes',
  }

  const updates: string[] = []
  const values: unknown[] = []
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in body) {
      updates.push(`${col} = ?`)
      values.push(body[key] ?? null)
    }
  }

  if (updates.length === 0) return c.json({ error: 'Nothing to update' }, 400)
  db.prepare(`UPDATE budget_transactions SET ${updates.join(', ')} WHERE id = ?`).run(...values, txId)

  const updated = db.prepare('SELECT * FROM budget_transactions WHERE id = ?').get(txId) as TxRow
  return c.json(txToJson(updated))
})

app.delete('/:id', (c) => {
  const userId = c.get('userId')
  const txId = c.req.param('id')
  const row = db.prepare('SELECT id FROM budget_transactions WHERE id = ? AND user_id = ?').get(txId, userId)
  if (!row) return c.json({ error: 'Not found' }, 404)
  db.prepare('DELETE FROM budget_transactions WHERE id = ?').run(txId)
  return c.json({ ok: true })
})

export default app
