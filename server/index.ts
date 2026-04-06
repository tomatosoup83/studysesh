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
import presetsRoute from './routes/presets.js'
import budgetCategoriesRoute from './routes/budget/categories.js'
import budgetTransactionsRoute from './routes/budget/transactions.js'
import budgetSettingsRoute from './routes/budget/settings.js'
import budgetTermsRoute from './routes/budget/terms.js'
import budgetLeaderboardRoute from './routes/budget/leaderboard.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = new Hono()

app.route('/api/auth', authRoute)
app.route('/api/tasks', tasksRoute)
app.route('/api/quotes', quotesRoute)
app.route('/api/presets', presetsRoute)
app.route('/api/sessions', sessionsRoute)
app.route('/api/leaderboard', leaderboardRoute)
app.route('/api/csv', csvRoute)
app.route('/api/goals', goalsRoute)
app.route('/api/budget/categories', budgetCategoriesRoute)
app.route('/api/budget/transactions', budgetTransactionsRoute)
app.route('/api/budget/settings', budgetSettingsRoute)
app.route('/api/budget/terms', budgetTermsRoute)
app.route('/api/budget/leaderboard', budgetLeaderboardRoute)

const distPath = join(__dirname, '../dist')
if (existsSync(distPath)) {
  // Serve static assets (JS, CSS, images) directly from dist/
  app.use('/*', serveStatic({ root: './dist' }))
  // SPA fallback — both apps use the same index.html
  app.get('/study/*', (c) => c.html(readFileSync(join(distPath, 'index.html'), 'utf-8')))
  app.get('/budget/*', (c) => c.html(readFileSync(join(distPath, 'index.html'), 'utf-8')))
  app.get('/', (c) => c.redirect('/study'))
}

const PORT = parseInt(process.env.PORT ?? '3001', 10)

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`StudySesh server running on http://0.0.0.0:${info.port}`)
})
