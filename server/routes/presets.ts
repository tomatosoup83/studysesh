import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const app = new Hono()

interface PresetRow {
  id: string
  name: string
  vars_json: string
  created_by: string | null
  created_at: number
}

function presetToJson(r: PresetRow) {
  return {
    id: r.id,
    name: r.name,
    vars: JSON.parse(r.vars_json) as Record<string, string>,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }
}

// GET /api/presets — public
app.get('/', (c) => {
  const presets = db.prepare('SELECT * FROM color_presets ORDER BY created_at DESC').all() as PresetRow[]
  return c.json({ presets: presets.map(presetToJson) })
})

// POST /api/presets — requires auth
app.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)
  const { name, vars } = body
  if (!name || typeof name !== 'string' || !name.trim()) return c.json({ error: 'name is required' }, 400)
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) return c.json({ error: 'vars must be an object' }, 400)

  const user = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId) as { display_name: string } | undefined
  const createdBy = user?.display_name ?? null
  const id = nanoid()
  db.prepare('INSERT INTO color_presets (id, name, vars_json, created_by) VALUES (?, ?, ?, ?)').run(
    id, name.trim(), JSON.stringify(vars), createdBy
  )
  const row = db.prepare('SELECT * FROM color_presets WHERE id = ?').get(id) as PresetRow
  return c.json(presetToJson(row), 201)
})

// DELETE /api/presets/:id — requires auth
app.delete('/:id', requireAuth, (c) => {
  const id = c.req.param('id')
  db.prepare('DELETE FROM color_presets WHERE id = ?').run(id)
  return c.json({ ok: true })
})

export default app
