/**
 * Email provider interface for sending transactional and marketing emails.
 *
 * All implementations must support:
 * - Transactional emails (order confirmations, shipping notifications)
 * - Template-based emails with variable substitution
 * - Bulk email sending for marketing campaigns
 *
 * @example
 * const provider = new ResendEmailProvider({ apiKey: env.RESEND_API_KEY })
 * await provider.sendTransactional({
 *   to: 'customer@example.com',
 *   subject: 'Order Confirmation',
 *   html: '<p>Your order #123 has been confirmed.</p>'
 * })
 */

import type {
  BulkEmailParams,
  EmailResult,
  TemplateEmailParams,
  TransactionalEmailParams,
} from './types.js'

export interface EmailProvider {
  /**
   * Send a single transactional email.
   *
   * @param params - Email parameters
   * @returns Result with message ID and status
   * @throws EmailProviderError if sending fails
   */
  sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>

  /**
   * Send an email using a predefined template.
   *
   * @param params - Template parameters with variables
   * @returns Result with message ID and status
   * @throws EmailProviderError if sending fails
   */
  sendTemplate(params: TemplateEmailParams): Promise<EmailResult>

  /**
   * Send bulk emails (marketing campaigns, announcements).
   *
   * @param params - Bulk email parameters
   * @returns Results for each recipient
   * @throws EmailProviderError if sending fails
   */
  sendBulk(params: BulkEmailParams): Promise<EmailResult[]>
}

// Re-export types
export * from './types.js'

// Export implementations
export { InMemoryEmailProvider } from './inmemory.provider.js'
export { ResendEmailProvider } from './resend.provider.js'
export { createEmailProvider } from './factory.js'
