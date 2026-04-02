import { Hono } from 'hono'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import db from '../db.js'
import { JWT_SECRET, requireAuth } from '../middleware/auth.js'

const app = new Hono()

interface UserRow {
  id: string
  login_name: string
  display_name: string
  password_hash: string
  avatar_base64: string | null
}

async function signToken(userId: string, loginName: string) {
  return new SignJWT({ sub: userId, loginName })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

function userResponse(u: UserRow) {
  return {
    id: u.id,
    loginName: u.login_name,
    displayName: u.display_name,
    avatarBase64: u.avatar_base64,
  }
}

app.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { loginName, displayName, password } = body
  if (!loginName || typeof loginName !== 'string' || loginName.trim().length < 2) {
    return c.json({ error: 'loginName must be at least 2 characters' }, 400)
  }
  if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 1) {
    return c.json({ error: 'displayName is required' }, 400)
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return c.json({ error: 'password must be at least 6 characters' }, 400)
  }

  const existing = db.prepare('SELECT id FROM users WHERE login_name = ?').get(loginName.trim().toLowerCase())
  if (existing) return c.json({ error: 'Username already taken' }, 409)

  const id = nanoid()
  const passwordHash = await bcrypt.hash(password, 10)

  db.prepare('INSERT INTO users (id, login_name, display_name, password_hash) VALUES (?, ?, ?, ?)')
    .run(id, loginName.trim().toLowerCase(), displayName.trim(), passwordHash)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
  const token = await signToken(id, user.login_name)

  return c.json({ token, user: userResponse(user) }, 201)
})

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { loginName, password } = body
  if (!loginName || !password) return c.json({ error: 'loginName and password required' }, 400)

  const user = db.prepare('SELECT * FROM users WHERE login_name = ?').get(loginName.trim().toLowerCase()) as UserRow | undefined
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const token = await signToken(user.id, user.login_name)
  return c.json({ token, user: userResponse(user) })
})

app.get('/me', requireAuth, (c) => {
  const userId = c.get('userId')
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ user: userResponse(user) })
})

app.patch('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json().catch(() => null)
  if (!body) return c.json({ error: 'Invalid JSON' }, 400)

  const { displayName, password, avatarBase64 } = body
  const updates: string[] = []
  const values: (string | null)[] = []

  if (displayName !== undefined) {
    if (typeof displayName !== 'string' || displayName.trim().length < 1) {
      return c.json({ error: 'displayName cannot be empty' }, 400)
    }
    updates.push('display_name = ?')
    values.push(displayName.trim())
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 6) {
      return c.json({ error: 'password must be at least 6 characters' }, 400)
    }
    updates.push('password_hash = ?')
    values.push(await bcrypt.hash(password, 10))
  }

  if (avatarBase64 !== undefined) {
    updates.push('avatar_base64 = ?')
    values.push(avatarBase64 ?? null)
  }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

  values.push(userId)
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow
  return c.json({ user: userResponse(user) })
})

export default app
