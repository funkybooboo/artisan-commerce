/**
 * Application configuration.
 *
 * Single source of truth for all config values. Nothing else in the app
 * reads env directly -- everything flows through here.
 *
 * Two families of builders:
 *   parse*Config(env)         -- production: parse from CF Workers env bindings
 *   *ConfigFromOptions(opts)  -- tests: synthesise from injected CreateAppOptions
 *
 * Both families return the same typed config objects so middleware and routes
 * are identical in production and test.
 */

import type { Bindings } from './index'

// ---------------------------------------------------------------------------
// Defaults -- every default lives here, documented, named, and exported
// ---------------------------------------------------------------------------

export const DEFAULTS = {
  /** Magic link token TTL in seconds (15 minutes) */
  MAGIC_LINK_EXPIRY_SECONDS: 900,
  /** Session JWT TTL in seconds (24 hours) */
  JWT_EXPIRY_SECONDS: 86_400,
  /** Rate limit: max requests per window */
  RATE_LIMIT_MAX: 10,
  /** Rate limit: window size in milliseconds (15 minutes) */
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  /** App base URL fallback */
  APP_BASE_URL: 'http://localhost:8787',
  /** Default allowed geo region */
  ALLOWED_REGION: 'UT',
  /** Default CORS allowed origins */
  CORS_ORIGINS: ['http://localhost:5173', 'https://artisan-commerce.pages.dev'] as string[],
}

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

export type AuthConfig = {
  jwtSecret: string
  magicLinkExpirySeconds: number
  jwtExpirySeconds: number
  appBaseUrl: string
  /** True when appBaseUrl is HTTPS -- controls the Secure cookie flag */
  secureCookie: boolean
}

export type GeoConfig = {
  allowedRegion: string
  bypassEnabled: boolean
}

export type RateLimitConfig = {
  max: number
  windowMs: number
}

export type CorsConfig = {
  origins: string[]
}

// ---------------------------------------------------------------------------
// Production parsers -- build config from CF Workers env bindings
// ---------------------------------------------------------------------------

/**
 * Parse auth config from env. Throws if JWT_SECRET is missing or too short.
 */
export function parseAuthConfig(env: Bindings): AuthConfig {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Set it in .dev.vars for local dev.')
  }
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.')
  }

  const appBaseUrl = env.APP_BASE_URL ?? DEFAULTS.APP_BASE_URL

  return {
    jwtSecret: env.JWT_SECRET,
    magicLinkExpirySeconds: env.MAGIC_LINK_EXPIRY
      ? Number.parseInt(env.MAGIC_LINK_EXPIRY, 10)
      : DEFAULTS.MAGIC_LINK_EXPIRY_SECONDS,
    jwtExpirySeconds: env.JWT_EXPIRY
      ? Number.parseInt(env.JWT_EXPIRY, 10)
      : DEFAULTS.JWT_EXPIRY_SECONDS,
    appBaseUrl,
    secureCookie: appBaseUrl.startsWith('https://'),
  }
}

/** Parse geo-restriction config from env bindings. */
export function parseGeoConfig(env: Bindings): GeoConfig {
  return {
    allowedRegion: env.ARTISAN_ALLOWED_REGION ?? DEFAULTS.ALLOWED_REGION,
    bypassEnabled: env.ARTISAN_IP_BYPASS === 'true',
  }
}

/** Parse rate-limit config from env bindings. */
export function parseRateLimitConfig(env: Bindings): RateLimitConfig {
  return {
    max: env.RATE_LIMIT_MAX ? Number.parseInt(env.RATE_LIMIT_MAX, 10) : DEFAULTS.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS
      ? Number.parseInt(env.RATE_LIMIT_WINDOW_MS, 10)
      : DEFAULTS.RATE_LIMIT_WINDOW_MS,
  }
}

/** Parse CORS config from env bindings. */
export function parseCorsConfig(env: Bindings): CorsConfig {
  return {
    origins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : DEFAULTS.CORS_ORIGINS,
  }
}

// ---------------------------------------------------------------------------
// Test builders -- synthesise config from injected options (no env access)
// ---------------------------------------------------------------------------

/**
 * Subset of CreateAppOptions relevant to config building.
 * Defined here to avoid a circular dependency with index.ts.
 */
export type ConfigOptions = {
  jwtSecret: string
  appBaseUrl?: string
  artisanIpBypass?: boolean
  rateLimitMax?: number
  rateLimitWindowMs?: number
}

/** Build AuthConfig from test injection options. */
export function authConfigFromOptions(opts: ConfigOptions): AuthConfig {
  const appBaseUrl = opts.appBaseUrl ?? DEFAULTS.APP_BASE_URL
  return {
    jwtSecret: opts.jwtSecret,
    magicLinkExpirySeconds: DEFAULTS.MAGIC_LINK_EXPIRY_SECONDS,
    jwtExpirySeconds: DEFAULTS.JWT_EXPIRY_SECONDS,
    appBaseUrl,
    secureCookie: appBaseUrl.startsWith('https://'),
  }
}

/** Build GeoConfig from test injection options. */
export function geoConfigFromOptions(opts: ConfigOptions): GeoConfig {
  return {
    allowedRegion: DEFAULTS.ALLOWED_REGION,
    bypassEnabled: opts.artisanIpBypass === true,
  }
}

/** Build RateLimitConfig from test injection options. */
export function rateLimitConfigFromOptions(opts: ConfigOptions): RateLimitConfig {
  return {
    max: opts.rateLimitMax ?? DEFAULTS.RATE_LIMIT_MAX,
    windowMs: opts.rateLimitWindowMs ?? DEFAULTS.RATE_LIMIT_WINDOW_MS,
  }
}

/** Build CorsConfig from test injection options. */
export function corsConfigFromOptions(_opts: ConfigOptions): CorsConfig {
  return {
    origins: [...DEFAULTS.CORS_ORIGINS],
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Build the magic link URL sent in emails. */
export function buildMagicLinkUrl(appBaseUrl: string, token: string): string {
  return `${appBaseUrl}/auth/verify?token=${token}`
}
