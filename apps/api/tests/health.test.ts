import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('Health endpoint', () => {
  it('should return ok status', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.version).toBe('0.1.0')
    expect(data.timestamp).toBeDefined()
  })

  it('should return API info at root', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.name).toBe('Artisan Commerce API')
    expect(data.version).toBe('0.1.0')
    expect(data.status).toBe('running')
  })
})
