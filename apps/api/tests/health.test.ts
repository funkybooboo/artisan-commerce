import { InMemoryEmailProvider } from '@artisan-commerce/adapters/email'
import { createApp } from '@artisan-commerce/api'
import { createTestClient } from '@artisan-commerce/db'
import { describe, expect, it } from 'vitest'
import { runMigrations } from './helpers/db'

const JWT_SECRET = 'test-secret-at-least-32-chars-long!!'

function makeApp() {
  const db = createTestClient()
  runMigrations(db)
  return createApp({ db, emailProvider: new InMemoryEmailProvider(), jwtSecret: JWT_SECRET })
}

describe('Health endpoint', () => {
  it('should return ok status', async () => {
    const app = makeApp()
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const data = (await res.json()) as Record<string, unknown>
    expect(data.status).toBe('ok')
    expect(data.version).toBe('0.2.0')
    expect(data.timestamp).toBeDefined()
  })

  it('should return API info at root', async () => {
    const app = makeApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)

    const data = (await res.json()) as Record<string, unknown>
    expect(data.name).toBe('Artisan Commerce API')
    expect(data.version).toBe('0.2.0')
    expect(data.status).toBe('running')
  })
})
