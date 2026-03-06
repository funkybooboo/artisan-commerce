/**
 * Role middleware -- enforces a required role on a route.
 *
 * Must be used after requireAuth (which sets c.var.user).
 * Returns 403 if the authenticated user does not have the required role.
 */

import type { Role } from '@artisan-commerce/shared/types'
import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../index'

export function requireRole(role: Role) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (c.var.user?.role !== role) {
      return c.json({ error: 'Forbidden.' }, 403)
    }
    await next()
  })
}
