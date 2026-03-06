/**
 * Auth routes -- /api/auth/*
 *
 * POST /api/auth/register  -- request a magic link (rate-limited)
 * GET  /api/auth/verify    -- redeem a magic link token (rate-limited)
 * POST /api/auth/logout    -- clear session cookie
 * GET  /api/auth/me        -- return current user (requires auth)
 *
 * Email provider is read from c.var.email (set by the startup middleware in
 * index.ts) so routes never instantiate providers themselves.
 */

import {
  signMagicLinkToken,
  signSessionToken,
  verifyMagicLinkToken,
} from '@artisan-commerce/shared/auth'
import { users } from '@artisan-commerce/shared/schema'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { buildMagicLinkUrl } from '../config'
import type { AppEnv } from '../index'
import { requireAuth } from '../middleware/auth'

const auth = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

auth.post('/register', async (c) => {
  const body = await c.req.json<{ email?: unknown }>().catch(() => ({ email: undefined }))

  if (
    typeof body.email !== 'string' ||
    !body.email.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  ) {
    return c.json({ error: 'A valid email address is required.' }, 400)
  }

  const email = body.email.trim().toLowerCase()
  const db = c.var.db
  const config = c.var.authConfig

  // Upsert -- no error if already registered (prevents email enumeration)
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (!existing) {
    const now = new Date()
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      role: 'customer',
      createdAt: now,
      updatedAt: now,
    })
  }

  // Generate magic link and send email regardless of whether user is new
  const token = await signMagicLinkToken(email, config.jwtSecret, config.magicLinkExpirySeconds)
  const magicLinkUrl = buildMagicLinkUrl(config.appBaseUrl, token)
  const expiryMinutes = Math.round(config.magicLinkExpirySeconds / 60)

  await c.var.email.sendTransactional({
    to: email,
    subject: 'Your sign-in link for Artisan Commerce',
    html: `<p>Click the link below to sign in. It expires in ${expiryMinutes} minutes.</p>
<p><a href="${magicLinkUrl}">Sign in to Artisan Commerce</a></p>
<p>Or copy this link: ${magicLinkUrl}</p>
<p>If you did not request this, you can ignore this email.</p>`,
    text: `Sign in to Artisan Commerce: ${magicLinkUrl}\n\nThis link expires in ${expiryMinutes} minutes. If you did not request it, ignore this email.`,
  })

  return c.json({ message: 'If that email is registered, a sign-in link is on its way.' })
})

// ---------------------------------------------------------------------------
// GET /api/auth/verify?token=
// ---------------------------------------------------------------------------

auth.get('/verify', async (c) => {
  const token = c.req.query('token')
  if (!token) {
    return c.json({ error: 'Token is required.' }, 400)
  }

  const config = c.var.authConfig
  const db = c.var.db

  let email: string
  try {
    const payload = await verifyMagicLinkToken(token, config.jwtSecret)
    email = payload.email
  } catch {
    return c.json({ error: 'Invalid or expired sign-in link.' }, 401)
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user) {
    return c.json({ error: 'User not found.' }, 401)
  }

  // Update lastLoginAt
  const now = new Date()
  await db.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, user.id))

  // Issue session JWT
  const sessionToken = await signSessionToken(
    user.id,
    user.role,
    config.jwtSecret,
    config.jwtExpirySeconds
  )

  setCookie(c, 'session', sessionToken, {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: 'Lax',
    path: '/',
    maxAge: config.jwtExpirySeconds,
  })

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? null,
    },
  })
})

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

auth.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.json({ message: 'Signed out.' })
})

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

auth.get('/me', requireAuth, async (c) => {
  const { id } = c.var.user
  const user = await c.var.db.query.users.findFirst({ where: eq(users.id, id) })

  if (!user) {
    return c.json({ error: 'User not found.' }, 401)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name ?? null,
      phone: user.phone ?? null,
      defaultAddress: user.defaultAddress ?? null,
    },
  })
})

export default auth
