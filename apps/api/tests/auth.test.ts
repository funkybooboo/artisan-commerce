/**
 * Integration tests for auth routes.
 *
 * Uses Hono's in-process request method -- no HTTP server needed.
 * DB is in-memory SQLite. Email is captured via InMemoryEmailProvider.
 */

import { InMemoryEmailProvider, InMemoryEmailStore } from '@artisan-commerce/adapters/email'
import { createApp } from '@artisan-commerce/api'
import { createTestClient } from '@artisan-commerce/db'
import { beforeEach, describe, expect, it } from 'vitest'
import { loginAndGetCookie } from './helpers/auth'
import { runMigrations } from './helpers/db'

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'

function makeApp() {
  const db = createTestClient()
  const emailStore = new InMemoryEmailStore()
  const emailProvider = new InMemoryEmailProvider(emailStore)
  runMigrations(db)
  const app = createApp({
    db,
    emailProvider,
    jwtSecret: JWT_SECRET,
    appBaseUrl: 'http://localhost:8787',
    artisanIpBypass: true,
  })
  return { app, emailStore }
}

let app: ReturnType<typeof makeApp>['app']
let emailStore: InMemoryEmailStore

beforeEach(() => {
  const result = makeApp()
  app = result.app
  emailStore = result.emailStore
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerAndGetToken(email: string): Promise<string> {
  await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const sent = emailStore.getLast()
  if (!sent || sent.type !== 'transactional') throw new Error('No email sent')
  const html = (sent.params as { html: string }).html
  const match = html.match(/token=([^"&\s<]+)/)
  if (!match?.[1]) throw new Error('No token found in email')
  return match[1]
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  it('returns 200 and sends a magic link email', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@example.com' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.message).toBeDefined()

    expect(emailStore.getCount()).toBe(1)
    const sent = emailStore.getLast()
    expect(sent?.type).toBe('transactional')
  })

  it('returns 200 even for an already-registered email (no enumeration)', async () => {
    await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@example.com' }),
    })

    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@example.com' }),
    })

    expect(res.status).toBe(200)
  })

  it('returns 400 for an invalid email', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// GET /api/auth/verify
// ---------------------------------------------------------------------------

describe('GET /api/auth/verify', () => {
  it('verifies a valid token and sets a session cookie', async () => {
    const token = await registerAndGetToken('customer@example.com')

    const res = await app.request(`/api/auth/verify?token=${token}`)

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect((body.user as Record<string, unknown>).email).toBe('customer@example.com')

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('session=')
    expect(setCookie).toContain('HttpOnly')
  })

  it('returns 400 for a missing token', async () => {
    const res = await app.request('/api/auth/verify')
    expect(res.status).toBe(400)
  })

  it('returns 401 for a garbage token', async () => {
    const res = await app.request('/api/auth/verify?token=garbage')
    expect(res.status).toBe(401)
  })

  it('returns 401 when a session token is used as a magic link token', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')
    const sessionToken = cookie.replace('session=', '')

    const res = await app.request(`/api/auth/verify?token=${sessionToken}`)
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const res = await app.request('/api/auth/logout', { method: 'POST' })

    expect(res.status).toBe(200)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toMatch(/session=;|session=.*Max-Age=0/)
  })
})

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

describe('GET /api/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')

    const res = await app.request('/api/auth/me', {
      headers: { Cookie: cookie },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.email).toBe('customer@example.com')
    expect(user.role).toBe('customer')
  })

  it('returns 401 when not authenticated', async () => {
    const res = await app.request('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 with an invalid session cookie', async () => {
    const res = await app.request('/api/auth/me', {
      headers: { Cookie: 'session=garbage' },
    })
    expect(res.status).toBe(401)
  })
})
