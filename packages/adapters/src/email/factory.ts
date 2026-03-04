/**
 * Factory function to create email providers based on environment configuration.
 */

import type { EmailProvider } from './index.js'
import { InMemoryEmailProvider } from './inmemory.provider.js'
import { ResendEmailProvider } from './resend.provider.js'

export interface EmailProviderEnv {
  EMAIL_PROVIDER?: string
  RESEND_API_KEY?: string
  EMAIL_FROM_ADDRESS?: string
  EMAIL_FROM_NAME?: string
}

/**
 * Create an email provider based on environment configuration.
 *
 * Supported providers:
 * - resend: Resend.com (production default)
 * - inmemory: In-memory provider for testing
 *
 * @param env - Environment configuration
 * @returns Configured email provider
 * @throws Error if provider is unknown or configuration is invalid
 *
 * @example
 * // Production
 * const provider = createEmailProvider({
 *   EMAIL_PROVIDER: 'resend',
 *   RESEND_API_KEY: 'your-key'
 * })
 *
 * // Testing
 * const provider = createEmailProvider({
 *   EMAIL_PROVIDER: 'inmemory'
 * })
 */
export function createEmailProvider(env: EmailProviderEnv): EmailProvider {
  const provider = env.EMAIL_PROVIDER || 'resend'

  switch (provider) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is required for Resend provider')
      }
      return new ResendEmailProvider({
        apiKey: env.RESEND_API_KEY,
        fromAddress: env.EMAIL_FROM_ADDRESS,
        fromName: env.EMAIL_FROM_NAME,
      })

    case 'inmemory':
      return new InMemoryEmailProvider()

    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}
