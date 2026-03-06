/**
 * In-memory email provider for testing.
 *
 * Implements EmailProvider. Inspection state (what was sent) lives in the
 * injected SentEmailStore -- tests hold a reference to the store directly.
 * This keeps the provider's single responsibility clear: send emails and
 * record them to the store.
 */

import type { EmailProvider } from './index.js'
import { InMemoryEmailStore } from './inmemory.store.js'
import type { SentEmailStore } from './sent-email-store.js'
import type {
  BulkEmailParams,
  EmailResult,
  TemplateEmailParams,
  TransactionalEmailParams,
} from './types.js'

export class InMemoryEmailProvider implements EmailProvider {
  private store: SentEmailStore
  private messageIdCounter = 0

  constructor(store: SentEmailStore = new InMemoryEmailStore()) {
    this.store = store
  }

  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.store.record({ type: 'transactional', params, timestamp: new Date() })
    this.messageIdCounter++
    return { success: true, messageId: `inmem-${this.messageIdCounter}` }
  }

  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.store.record({ type: 'template', params, timestamp: new Date() })
    this.messageIdCounter++
    return { success: true, messageId: `inmem-${this.messageIdCounter}` }
  }

  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.store.record({ type: 'bulk', params, timestamp: new Date() })
    return params.recipients.map(() => {
      this.messageIdCounter++
      return { success: true, messageId: `inmem-${this.messageIdCounter}` }
    })
  }
}
