/**
 * Auth middleware -- verifies the session cookie and sets c.var.user.
 *
 * Reads the `session` httpOnly cookie, verifies it as a session JWT,
 * and populates c.var.user with { id, email, role }.
 * Returns 401 if the cookie is missing, expired, or invalid.
 */

import { verifySessionToken } from '@artisan-commerce/shared/auth'
import { users } from '@artisan-commerce/shared/schema'
import { eq } from 'drizzle-orm'
import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../index'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) {
    return c.json({ error: 'Authentication required.' }, 401)
  }

  let userId: string
  let role: 'customer' | 'artisan'
  try {
    const payload = await verifySessionToken(token, c.var.authConfig.jwtSecret)
    userId = payload.userId
    role = payload.role
  } catch {
    return c.json({ error: 'Session expired or invalid. Please sign in again.' }, 401)
  }

  // Hydrate user from DB so routes always have fresh data
  const user = await c.var.db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return c.json({ error: 'User not found.' }, 401)
  }

  c.set('user', { id: user.id, email: user.email, role })
  await next()
})
