/**
 * Integration tests for user profile routes.
 */

import { InMemoryEmailProvider, InMemoryEmailStore } from '@artisan-commerce/adapters/email'
import { createApp } from '@artisan-commerce/api'
import { createTestClient } from '@artisan-commerce/db'
import { beforeEach, describe, expect, it } from 'vitest'
import { loginAndGetCookie } from './helpers/auth'
import { runMigrations } from './helpers/db'

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
// PATCH /api/users/me
// ---------------------------------------------------------------------------

describe('PATCH /api/users/me', () => {
  it('updates name and phone', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Alice', phone: '555-1234' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.name).toBe('Alice')
    expect(user.phone).toBe('555-1234')
    expect(user.email).toBe('customer@example.com')
  })

  it('updates defaultAddress', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')
    const address = {
      street: '123 Main St',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84101',
      country: 'US',
    }

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ defaultAddress: address }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.defaultAddress).toEqual(address)
  })

  it('clears defaultAddress when null is passed', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')

    await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        defaultAddress: {
          street: '1 A St',
          city: 'Provo',
          state: 'UT',
          zip: '84601',
          country: 'US',
        },
      }),
    })

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ defaultAddress: null }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.defaultAddress).toBeNull()
  })

  it('returns 401 when not authenticated', async () => {
    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice' }),
    })
    expect(res.status).toBe(401)
  })

  it('ignores attempts to change email or role', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')

    const res = await app.request('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ email: 'hacker@evil.com', role: 'artisan', name: 'Alice' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.email).toBe('customer@example.com')
    expect(user.role).toBe('customer')
  })
})

// ---------------------------------------------------------------------------
// GET /api/users/me
// ---------------------------------------------------------------------------

describe('GET /api/users/me', () => {
  it('returns the current user profile', async () => {
    const cookie = await loginAndGetCookie(app, emailStore, 'customer@example.com')

    const res = await app.request('/api/users/me', {
      headers: { Cookie: cookie },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    const user = body.user as Record<string, unknown>
    expect(user.email).toBe('customer@example.com')
    expect(user.role).toBe('customer')
  })

  it('returns 401 when not authenticated', async () => {
    const res = await app.request('/api/users/me')
    expect(res.status).toBe(401)
  })
})
