/**
 * Artisan Commerce API
 * Hono Workers API for Cloudflare Workers
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import health from './routes/health'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS middleware
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:5173', 'https://artisan-commerce.pages.dev'],
    credentials: true,
  })
)

// Routes
app.route('/health', health)

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Artisan Commerce API',
    version: '0.1.0',
    status: 'running',
  })
})

// Export app and types for Hono RPC
export default app
export type AppType = typeof app
