import {
  AuthError,
  signMagicLinkToken,
  signSessionToken,
  verifyMagicLinkToken,
  verifySessionToken,
} from '@artisan-commerce/shared/auth'
import { describe, expect, it } from 'vitest'

const TEST_SECRET = 'test-secret-minimum-32-chars-long!!'

describe('signMagicLinkToken / verifyMagicLinkToken', () => {
  it('round-trips email correctly', async () => {
    const token = await signMagicLinkToken('user@example.com', TEST_SECRET)
    const payload = await verifyMagicLinkToken(token, TEST_SECRET)
    expect(payload.email).toBe('user@example.com')
  })

  it('throws AuthError EXPIRED for an expired token', async () => {
    // 1-second expiry
    const token = await signMagicLinkToken('user@example.com', TEST_SECRET, 1)
    // wait 1.1 seconds so it expires
    await new Promise((r) => setTimeout(r, 1100))
    await expect(verifyMagicLinkToken(token, TEST_SECRET)).rejects.toMatchObject({
      code: 'EXPIRED',
    })
  })

  it('throws AuthError INVALID for a tampered token', async () => {
    const token = await signMagicLinkToken('user@example.com', TEST_SECRET)
    const tampered = `${token.slice(0, -4)}XXXX`
    await expect(verifyMagicLinkToken(tampered, TEST_SECRET)).rejects.toMatchObject({
      code: 'INVALID',
    })
  })

  it('throws AuthError INVALID when verified with wrong secret', async () => {
    const token = await signMagicLinkToken('user@example.com', TEST_SECRET)
    await expect(
      verifyMagicLinkToken(token, 'wrong-secret-minimum-32-chars-long!!')
    ).rejects.toMatchObject({
      code: 'INVALID',
    })
  })

  it('rejects a session token when using verifyMagicLinkToken', async () => {
    const sessionToken = await signSessionToken('user-id-123', 'customer', TEST_SECRET)
    await expect(verifyMagicLinkToken(sessionToken, TEST_SECRET)).rejects.toMatchObject({
      code: 'INVALID',
    })
  })
})

describe('signSessionToken / verifySessionToken', () => {
  it('round-trips userId and role correctly', async () => {
    const token = await signSessionToken('user-id-123', 'customer', TEST_SECRET)
    const payload = await verifySessionToken(token, TEST_SECRET)
    expect(payload.userId).toBe('user-id-123')
    expect(payload.role).toBe('customer')
  })

  it('round-trips artisan role', async () => {
    const token = await signSessionToken('artisan-id-456', 'artisan', TEST_SECRET)
    const payload = await verifySessionToken(token, TEST_SECRET)
    expect(payload.userId).toBe('artisan-id-456')
    expect(payload.role).toBe('artisan')
  })

  it('throws AuthError EXPIRED for an expired token', async () => {
    const token = await signSessionToken('user-id-123', 'customer', TEST_SECRET, 1)
    await new Promise((r) => setTimeout(r, 1100))
    await expect(verifySessionToken(token, TEST_SECRET)).rejects.toMatchObject({
      code: 'EXPIRED',
    })
  })

  it('throws AuthError INVALID for a tampered token', async () => {
    const token = await signSessionToken('user-id-123', 'customer', TEST_SECRET)
    const tampered = `${token.slice(0, -4)}XXXX`
    await expect(verifySessionToken(tampered, TEST_SECRET)).rejects.toMatchObject({
      code: 'INVALID',
    })
  })

  it('throws AuthError INVALID when verified with wrong secret', async () => {
    const token = await signSessionToken('user-id-123', 'customer', TEST_SECRET)
    await expect(
      verifySessionToken(token, 'wrong-secret-minimum-32-chars-long!!')
    ).rejects.toMatchObject({
      code: 'INVALID',
    })
  })

  it('rejects a magic link token when using verifySessionToken', async () => {
    const magicToken = await signMagicLinkToken('user@example.com', TEST_SECRET)
    await expect(verifySessionToken(magicToken, TEST_SECRET)).rejects.toMatchObject({
      code: 'INVALID',
    })
  })
})

describe('AuthError', () => {
  it('is an instance of Error', () => {
    const err = new AuthError('test', 'MISSING')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('MISSING')
    expect(err.message).toBe('test')
  })
})
