import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import sessionsRoute from './routes/sessions.js'
import leaderboardRoute from './routes/leaderboard.js'
import csvRoute from './routes/csv.js'
import goalsRoute from './routes/goals.js'
import authRoute from './routes/auth.js'
import tasksRoute from './routes/tasks.js'
import quotesRoute from './routes/quotes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = new Hono()

app.route('/api/auth', authRoute)
app.route('/api/tasks', tasksRoute)
app.route('/api/quotes', quotesRoute)
app.route('/api/sessions', sessionsRoute)
app.route('/api/leaderboard', leaderboardRoute)
app.route('/api/csv', csvRoute)
app.route('/api/goals', goalsRoute)

const distPath = join(__dirname, '../dist')
if (existsSync(distPath)) {
  app.use('/*', serveStatic({ 
    root: './dist',
    rewriteRequestPath: (path) => path.replace(/^\/study/, '') 
   }))
  app.get('*', (c) => {
    const html = readFileSync(join(distPath, 'index.html'), 'utf-8')
    return c.html(html)
  })
}

const PORT = parseInt(process.env.PORT ?? '3001', 10)

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`StudySesh server running on http://0.0.0.0:${info.port}`)
})
