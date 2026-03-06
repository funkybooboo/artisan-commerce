/**
 * Artisan Commerce API entry point.
 *
 * Exports:
 *   createApp(opts?)  -- app factory used by both production and tests
 *   Bindings          -- Cloudflare Workers env type
 *   Variables         -- per-request context type
 *   AppEnv            -- combined type for Hono generics
 *
 * In production the default export is the Hono app instance (required by CF Workers).
 * Tests call createApp({ db, emailProvider, ... }) to inject fakes.
 *
 * All config is resolved once per request in the startup middleware and stored
 * in c.var. Middleware and routes read from c.var -- never from c.env directly.
 * This is what makes the test injection pattern work: c.env is undefined when
 * using Hono's in-process app.request(), so we must never touch it in tests.
 */

import type { EmailProvider } from '@artisan-commerce/adapters/email'
import { createEmailProvider } from '@artisan-commerce/adapters/email'
import { createD1Client, type createTestClient } from '@artisan-commerce/db'
import type { createD1Client as createD1ClientType } from '@artisan-commerce/db'
import type { Role } from '@artisan-commerce/shared/types'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  type AuthConfig,
  type ConfigOptions,
  type CorsConfig,
  type GeoConfig,
  type RateLimitConfig,
  authConfigFromOptions,
  corsConfigFromOptions,
  geoConfigFromOptions,
  parseAuthConfig,
  parseGeoConfig,
  parseRateLimitConfig,
  rateLimitConfigFromOptions,
} from './config'
import { createRateLimitMiddleware } from './middleware/rate-limit'
import auth from './routes/auth'
import health from './routes/health'
import usersRoute from './routes/users'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Cloudflare Workers environment bindings.
 * Secrets (JWT_SECRET, RESEND_API_KEY) are set via `wrangler secret put`
 * in production, or in .dev.vars locally (see .dev.vars.example).
 */
export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  MAGIC_LINK_EXPIRY?: string
  JWT_EXPIRY?: string
  EMAIL_PROVIDER?: string
  RESEND_API_KEY?: string
  EMAIL_FROM_ADDRESS?: string
  EMAIL_FROM_NAME?: string
  APP_BASE_URL?: string
  ARTISAN_ALLOWED_REGION?: string
  ARTISAN_IP_BYPASS?: string
  RATE_LIMIT_MAX?: string
  RATE_LIMIT_WINDOW_MS?: string
  CORS_ORIGINS?: string
}

/**
 * Per-request context variables set by the startup middleware.
 * Routes and middleware read these via c.var -- never c.env.
 */
export type Variables = {
  user: { id: string; email: string; role: Role }
  db: ReturnType<typeof createD1ClientType>
  email: EmailProvider
  authConfig: AuthConfig
  geoConfig: GeoConfig
  rateLimitConfig: RateLimitConfig
  corsConfig: CorsConfig
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }

// ---------------------------------------------------------------------------
// Test injection options
// ---------------------------------------------------------------------------

/**
 * Options for createApp -- used in integration tests only.
 * In production createApp() is called with no arguments.
 */
export type CreateAppOptions = {
  /** In-memory SQLite client (from createTestClient) */
  db: ReturnType<typeof createTestClient>
  /** Fake email provider (e.g. InMemoryEmailProvider) */
  emailProvider: EmailProvider
  /** JWT signing secret */
  jwtSecret: string
  /** App base URL for magic link URLs */
  appBaseUrl?: string
  /** Skip Utah IP check */
  artisanIpBypass?: boolean
  /** Custom rate limit settings (useful for rate-limit tests) */
  rateLimitMax?: number
  rateLimitWindowMs?: number
}

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

/**
 * Create the Hono application.
 *
 * Production: call with no args -- all config comes from CF Workers env.
 * Tests: call with CreateAppOptions -- injected deps bypass CF runtime.
 */
export function createApp(opts?: CreateAppOptions) {
  const app = new Hono<AppEnv>()

  // Rate-limit middleware gets a fresh store per app instance.
  // In production the store lives as long as the Worker isolate.
  // In tests each createApp() call gets its own store, so state never leaks.
  const rateLimitStore = new Map()
  const rateLimit = createRateLimitMiddleware(rateLimitStore)

  // CORS config is resolved once at app creation time (not per-request).
  // In production we use defaults; in tests we use injected options.
  const corsConfig = opts ? corsConfigFromOptions(opts) : corsConfigFromOptions({} as ConfigOptions)

  // CORS -- allow web app origins from config
  app.use(
    '/api/*',
    cors({
      origin: corsConfig.origins,
      credentials: true,
    })
  )

  // Resolve config and attach DB + email to every request.
  // Production: parse from CF env; Tests: build from injected opts.
  app.use('*', async (c, next) => {
    if (opts) {
      c.set('authConfig', authConfigFromOptions(opts))
      c.set('geoConfig', geoConfigFromOptions(opts))
      c.set('rateLimitConfig', rateLimitConfigFromOptions(opts))
      c.set('corsConfig', corsConfig)
      c.set('db', opts.db as unknown as Variables['db'])
      c.set('email', opts.emailProvider)
    } else {
      c.set('authConfig', parseAuthConfig(c.env))
      c.set('geoConfig', parseGeoConfig(c.env))
      c.set('rateLimitConfig', parseRateLimitConfig(c.env))
      c.set('corsConfig', corsConfig)
      c.set('db', createD1Client(c.env.DB))
      c.set('email', createEmailProvider(c.env))
    }
    await next()
  })

  // Rate limiting on auth endpoints
  app.use('/api/auth/*', rateLimit)

  // Routes
  app.route('/health', health)
  app.route('/api/auth', auth)
  app.route('/api/users', usersRoute)

  // Root info
  app.get('/', (c) => {
    return c.json({ name: 'Artisan Commerce API', version: '0.2.0', status: 'running' })
  })

  return app
}

// ---------------------------------------------------------------------------
// Production entry point (Cloudflare Workers)
// ---------------------------------------------------------------------------

const app = createApp()

export default app
export type AppType = typeof app
