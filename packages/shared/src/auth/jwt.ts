/**
 * JWT helpers for magic link and session tokens.
 *
 * Uses hono/jwt (Web Crypto API, Cloudflare Workers compatible).
 * No external dependencies beyond hono which is already in the app.
 *
 * Token types are distinguished by a `type` claim so a magic-link
 * token cannot be accepted by verifySessionToken and vice versa.
 */

import { sign, verify } from 'hono/jwt'

// -----------------------------------------------------------------------
// Typed errors
// -----------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'EXPIRED' | 'INVALID' | 'MISSING'
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// -----------------------------------------------------------------------
// Token type discriminators (prevent cross-use of tokens)
// -----------------------------------------------------------------------

const MAGIC_LINK_TYPE = 'magic_link' as const
const SESSION_TYPE = 'session' as const

// -----------------------------------------------------------------------
// Magic link token
// -----------------------------------------------------------------------

/**
 * Sign a short-lived magic link token containing the user's email.
 *
 * @param email - The user's email address
 * @param secret - JWT signing secret (min 32 chars recommended)
 * @param expirySeconds - Token TTL in seconds (default 900 = 15 min)
 */
export async function signMagicLinkToken(
  email: string,
  secret: string,
  expirySeconds = 900
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign(
    {
      type: MAGIC_LINK_TYPE,
      email,
      iat: now,
      exp: now + expirySeconds,
    },
    secret
  )
}

/**
 * Type guard to check if an error is a JWT expiration error.
 * Hono's JWT library throws errors with specific messages for expiration.
 */
function isJwtExpiredError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('exp')
}

/**
 * Verify a magic link token and return the email claim.
 *
 * @throws AuthError with code 'EXPIRED' if the token has expired
 * @throws AuthError with code 'INVALID' for any other verification failure
 */
export async function verifyMagicLinkToken(
  token: string,
  secret: string
): Promise<{ email: string }> {
  let payload: Record<string, unknown>
  try {
    payload = await verify(token, secret, 'HS256')
  } catch (err) {
    if (isJwtExpiredError(err)) {
      throw new AuthError('Magic link has expired. Request a new one.', 'EXPIRED')
    }
    throw new AuthError('Invalid magic link token.', 'INVALID')
  }

  if (payload.type !== MAGIC_LINK_TYPE || typeof payload.email !== 'string') {
    throw new AuthError('Invalid magic link token.', 'INVALID')
  }

  return { email: payload.email }
}

// -----------------------------------------------------------------------
// Session token
// -----------------------------------------------------------------------

/**
 * Sign a session token containing userId and role.
 *
 * @param userId - The user's ID
 * @param role - The user's role ('customer' | 'artisan')
 * @param secret - JWT signing secret
 * @param expirySeconds - Token TTL in seconds (default 86400 = 24 hr)
 */
export async function signSessionToken(
  userId: string,
  role: 'customer' | 'artisan',
  secret: string,
  expirySeconds = 86400
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return sign(
    {
      type: SESSION_TYPE,
      userId,
      role,
      iat: now,
      exp: now + expirySeconds,
    },
    secret
  )
}

/**
 * Verify a session token and return userId and role.
 *
 * @throws AuthError with code 'EXPIRED' if the token has expired
 * @throws AuthError with code 'INVALID' for any other verification failure
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<{ userId: string; role: 'customer' | 'artisan' }> {
  let payload: Record<string, unknown>
  try {
    payload = await verify(token, secret, 'HS256')
  } catch (err) {
    if (isJwtExpiredError(err)) {
      throw new AuthError('Session has expired.', 'EXPIRED')
    }
    throw new AuthError('Invalid session token.', 'INVALID')
  }

  if (
    payload.type !== SESSION_TYPE ||
    typeof payload.userId !== 'string' ||
    (payload.role !== 'customer' && payload.role !== 'artisan')
  ) {
    throw new AuthError('Invalid session token.', 'INVALID')
  }

  return {
    userId: payload.userId,
    role: payload.role,
  }
}
