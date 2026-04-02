import { createMiddleware } from 'hono/factory'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'studysesh-dev-secret-change-in-prod')

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    c.set('userId', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

export { JWT_SECRET }
