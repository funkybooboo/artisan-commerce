/**
 * Contract for recording and inspecting sent emails.
 *
 * Keeping this separate from EmailProvider means test implementations
 * can inspect outbox state without any coupling to the provider that
 * recorded it. Production code never needs to import this interface.
 */

import type { BulkEmailParams, TemplateEmailParams, TransactionalEmailParams } from './types.js'

export interface SentEmail {
  type: 'transactional' | 'template' | 'bulk'
  params: TransactionalEmailParams | TemplateEmailParams | BulkEmailParams
  timestamp: Date
}

export interface SentEmailStore {
  /** Record a sent email. Called by the provider after each send. */
  record(email: SentEmail): void

  /** Return all recorded emails in send order. */
  getAll(): SentEmail[]

  /** Return the most recently recorded email, or undefined if empty. */
  getLast(): SentEmail | undefined

  /** Return the number of recorded emails. */
  getCount(): number

  /** Clear all recorded emails and reset the counter. */
  clear(): void
}
