import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import db from '../../db.js'
import { requireAuth } from '../../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

interface TermRow { id: string; name: string; start_date: string; end_date: string; sort_order: number }
interface HolidayRow { id: string; date: string; name: string }

function getTermsAndHolidays(userId: string) {
  const terms = (db.prepare('SELECT id, name, start_date, end_date, sort_order FROM budget_terms WHERE user_id = ? ORDER BY sort_order ASC').all(userId) as TermRow[])
    .map((r) => ({ id: r.id, name: r.name, startDate: r.start_date, endDate: r.end_date, sortOrder: r.sort_order }))
  const holidays = (db.prepare('SELECT id, date, name FROM budget_holidays WHERE user_id = ? ORDER BY date ASC').all(userId) as HolidayRow[])
    .map((r) => ({ id: r.id, date: r.date, name: r.name }))
  return { terms, holidays }
}

app.get('/', (c) => {
  const userId = c.get('userId')
  return c.json(getTermsAndHolidays(userId))
})

app.put('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ terms: { name: string; startDate: string; endDate: string; sortOrder: number }[] }>()

  // Bulk replace — delete existing, re-insert
  db.prepare('DELETE FROM budget_holidays WHERE user_id = ?').run(userId)
  db.prepare('DELETE FROM budget_terms WHERE user_id = ?').run(userId)

  const insertTerm = db.prepare('INSERT INTO budget_terms (id, user_id, name, start_date, end_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
  const insertAll = db.transaction((terms: typeof body.terms) => {
    for (const t of terms) {
      insertTerm.run(nanoid(), userId, t.name, t.startDate, t.endDate, t.sortOrder)
    }
  })
  insertAll(body.terms ?? [])

  return c.json(getTermsAndHolidays(userId))
})

app.post('/holidays', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ date: string; name: string }>()
  if (!body.date || !body.name?.trim()) return c.json({ error: 'date and name required' }, 400)

  const id = nanoid()
  db.prepare('INSERT INTO budget_holidays (id, user_id, date, name) VALUES (?, ?, ?, ?)').run(id, userId, body.date, body.name.trim())
  return c.json({ id, date: body.date, name: body.name.trim() }, 201)
})

app.delete('/holidays/:id', (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const row = db.prepare('SELECT id FROM budget_holidays WHERE id = ? AND user_id = ?').get(id, userId)
  if (!row) return c.json({ error: 'Not found' }, 404)
  db.prepare('DELETE FROM budget_holidays WHERE id = ?').run(id)
  return c.json({ ok: true })
})

export default app
