/**
 * Geo middleware -- restricts artisan-only routes to Utah IP addresses.
 *
 * Reads the Cloudflare `CF-IPCountry` and `CF-IPRegion` headers.
 * Bypass via ARTISAN_IP_BYPASS=true (local dev) or ARTISAN_ALLOWED_REGION=all.
 *
 * NOTE: CF-IPCountry/CF-IPRegion are only populated by Cloudflare in production.
 * In local dev use ARTISAN_IP_BYPASS=true in .dev.vars.
 */

import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../index'

// Cloudflare sets CF-IPCountry and adds regional data in the request headers.
// The state abbreviation is available as the value of the cf.regionCode property
// on the incoming request -- Hono surfaces it via c.req.raw.cf?.regionCode.
// As a fallback we also accept it from a CF-IPState header (populated in some
// Cloudflare setups and in tests).

export const requireUtahIp = createMiddleware<AppEnv>(async (c, next) => {
  const config = c.var.geoConfig

  if (config.bypassEnabled || config.allowedRegion === 'all') {
    await next()
    return
  }

  // In a real CF Worker the region is on the request's `cf` object.
  const cf = c.req.raw.cf as Record<string, unknown> | undefined
  const region = (cf?.regionCode as string | undefined) ?? c.req.header('CF-IPState') ?? ''

  if (region.toUpperCase() !== config.allowedRegion.toUpperCase()) {
    return c.json({ error: `Access restricted to ${config.allowedRegion}.` }, 403)
  }

  await next()
})
