/**
 * User profile routes -- /api/users/*
 *
 * GET   /api/users/me  -- return current user profile
 * PATCH /api/users/me  -- update name, phone, defaultAddress
 *
 * email and role are immutable via this endpoint.
 */

import { users } from '@artisan-commerce/shared/schema'
import type { User } from '@artisan-commerce/shared/schema'
import type { Address } from '@artisan-commerce/shared/types'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { AppEnv } from '../index'
import { requireAuth } from '../middleware/auth'

const usersRoute = new Hono<AppEnv>()

// Shared helper: shape user for response (never expose internal fields)
function userResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? null,
    phone: user.phone ?? null,
    defaultAddress: user.defaultAddress ?? null,
  }
}

// ---------------------------------------------------------------------------
// GET /api/users/me
// ---------------------------------------------------------------------------

usersRoute.get('/me', requireAuth, async (c) => {
  const user = await c.var.db.query.users.findFirst({
    where: eq(users.id, c.var.user.id),
  })

  if (!user) {
    return c.json({ error: 'User not found.' }, 401)
  }

  return c.json({ user: userResponse(user) })
})

// ---------------------------------------------------------------------------
// PATCH /api/users/me
// ---------------------------------------------------------------------------

type PatchBody = {
  name?: string | null
  phone?: string | null
  defaultAddress?: Address | null
}

usersRoute.patch('/me', requireAuth, async (c) => {
  const body = await c.req.json<PatchBody>().catch(() => null)
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Invalid request body.' }, 400)
  }

  // Build only the fields the caller provided -- ignore email and role
  const updates: Partial<Pick<User, 'name' | 'phone' | 'defaultAddress' | 'updatedAt'>> = {
    updatedAt: new Date(),
  }

  if ('name' in body) {
    updates.name = typeof body.name === 'string' ? body.name.trim() || null : null
  }
  if ('phone' in body) {
    updates.phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  }
  if ('defaultAddress' in body) {
    updates.defaultAddress = body.defaultAddress ?? null
  }

  await c.var.db.update(users).set(updates).where(eq(users.id, c.var.user.id))

  const updated = await c.var.db.query.users.findFirst({
    where: eq(users.id, c.var.user.id),
  })

  if (!updated) {
    return c.json({ error: 'User not found.' }, 401)
  }

  return c.json({ user: userResponse(updated) })
})

export default usersRoute
