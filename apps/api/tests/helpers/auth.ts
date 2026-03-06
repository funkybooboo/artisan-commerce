/**
 * Auth test helpers.
 *
 * Shared utilities for integration tests that require an authenticated user.
 */

import type { InMemoryEmailStore } from '@artisan-commerce/adapters/email'
import type { createApp } from '@artisan-commerce/api'

type App = ReturnType<typeof createApp>

/**
 * Register a user via the magic link flow, verify the token, and return the
 * session cookie string ready to pass as a Cookie header.
 *
 * Clears the email store after consuming the token so subsequent calls to
 * emailStore.getLast() reflect fresh sends.
 */
export async function loginAndGetCookie(
  app: App,
  emailStore: InMemoryEmailStore,
  email: string
): Promise<string> {
  await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const sent = emailStore.getLast()
  if (!sent || sent.type !== 'transactional') throw new Error('No email sent')
  const html = (sent.params as { html: string }).html
  const match = html.match(/token=([^"&\s<]+)/)
  if (!match?.[1]) throw new Error('No token found in email')
  const token = match[1]

  const verifyRes = await app.request(`/api/auth/verify?token=${token}`)
  const cookie = verifyRes.headers.get('set-cookie') ?? ''
  const sessionMatch = cookie.match(/session=([^;]+)/)
  if (!sessionMatch?.[1]) throw new Error('No session cookie set')

  emailStore.clear()
  return `session=${sessionMatch[1]}`
}
