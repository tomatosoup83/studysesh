import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const app = new Hono()
app.use('*', requireAuth)

interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  column_id: string
  priority: string
  subject_id: string | null
  subtasks_json: string
  estimated_pomodoros: number | null
  actual_pomodoros: number
  created_at: number
  completed_at: number | null
  sort_order: number
  due_date: number | null
}

interface SubjectRow {
  id: string
  user_id: string
  name: string
  color: string
}

function taskToJson(r: TaskRow) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    columnId: r.column_id,
    priority: r.priority,
    subjectId: r.subject_id,
    subtasks: JSON.parse(r.subtasks_json),
    estimatedPomodoros: r.estimated_pomodoros,
    actualPomodoros: r.actual_pomodoros,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    sortOrder: r.sort_order,
    dueDate: r.due_date ?? undefined,
  }
}

// GET /api/tasks
app.get('/', (c) => {
  const userId = c.get('userId')
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC').all(userId) as TaskRow[]
  const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ?').all(userId) as SubjectRow[]
  return c.json({
    tasks: tasks.map(taskToJson),
    subjects: subjects.map(s => ({ id: s.id, name: s.name, color: s.color })),
  })
})

// POST /api/tasks
app.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { id, title, description, columnId, priority, subjectId, subtasks, estimatedPomodoros, actualPomodoros, createdAt, completedAt, sortOrder, dueDate } = body
  if (!title || typeof title !== 'string') return c.json({ error: 'title is required' }, 400)

  const taskId = id ?? nanoid()
  db.prepare(`
    INSERT INTO tasks (id, user_id, title, description, column_id, priority, subject_id, subtasks_json, estimated_pomodoros, actual_pomodoros, created_at, completed_at, sort_order, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId, userId, title,
    description ?? null,
    columnId ?? 'not-started',
    priority ?? 'medium',
    subjectId ?? null,
    JSON.stringify(subtasks ?? []),
    estimatedPomodoros ?? null,
    actualPomodoros ?? 0,
    createdAt ?? Date.now(),
    completedAt ?? null,
    sortOrder ?? 0,
    dueDate ?? null
  )

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow
  return c.json(taskToJson(task), 201)
})

// PATCH /api/tasks/:id
app.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const taskId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', columnId: 'column_id',
    priority: 'priority', subjectId: 'subject_id', estimatedPomodoros: 'estimated_pomodoros',
    actualPomodoros: 'actual_pomodoros', completedAt: 'completed_at', sortOrder: 'sort_order',
    dueDate: 'due_date',
  }

  const updates: string[] = []
  const values: unknown[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in body) {
      updates.push(`${col} = ?`)
      values.push(body[key] ?? null)
    }
  }

  if ('subtasks' in body) {
    updates.push('subtasks_json = ?')
    values.push(JSON.stringify(body.subtasks))
  }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

  values.push(taskId)
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow
  return c.json(taskToJson(task))
})

// DELETE /api/tasks/:id
app.delete('/:id', (c) => {
  const userId = c.get('userId')
  const taskId = c.req.param('id')
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId)
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId)
  return c.json({ ok: true })
})

// PUT /api/tasks/order — bulk update sort_order for tasks in a column
app.put('/order', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body || !Array.isArray(body.taskIds)) return c.json({ error: 'taskIds array required' }, 400)

  const update = db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND user_id = ?')
  const updateMany = db.transaction((taskIds: string[]) => {
    taskIds.forEach((id, index) => update.run(index, id, userId))
  })
  updateMany(body.taskIds)
  return c.json({ ok: true })
})

// GET /api/tasks/subjects
app.get('/subjects', (c) => {
  const userId = c.get('userId')
  const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ?').all(userId) as SubjectRow[]
  return c.json({ subjects: subjects.map(s => ({ id: s.id, name: s.name, color: s.color })) })
})

// POST /api/tasks/subjects
app.post('/subjects', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)
  const { id, name, color } = body
  if (!name || !color) return c.json({ error: 'name and color required' }, 400)
  const subjectId = id ?? nanoid()
  db.prepare('INSERT OR REPLACE INTO subjects (id, user_id, name, color) VALUES (?, ?, ?, ?)').run(subjectId, userId, name, color)
  return c.json({ id: subjectId, name, color }, 201)
})

// DELETE /api/tasks/subjects/:id
app.delete('/subjects/:id', (c) => {
  const userId = c.get('userId')
  const subjectId = c.req.param('id')
  db.prepare('DELETE FROM subjects WHERE id = ? AND user_id = ?').run(subjectId, userId)
  return c.json({ ok: true })
})

export default app
