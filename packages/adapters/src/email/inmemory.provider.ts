/**
 * In-memory email provider for testing.
 * Stores sent emails in memory for inspection.
 */

import type { EmailProvider } from './index.js'
import type {
  BulkEmailParams,
  EmailResult,
  TemplateEmailParams,
  TransactionalEmailParams,
} from './types.js'

interface SentEmail {
  type: 'transactional' | 'template' | 'bulk'
  params: TransactionalEmailParams | TemplateEmailParams | BulkEmailParams
  timestamp: Date
}

export class InMemoryEmailProvider implements EmailProvider {
  private sent: SentEmail[] = []
  private messageIdCounter = 0

  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.sent.push({
      type: 'transactional',
      params,
      timestamp: new Date(),
    })
    this.messageIdCounter++
    return {
      success: true,
      messageId: `inmem-${this.messageIdCounter}`,
    }
  }

  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.sent.push({
      type: 'template',
      params,
      timestamp: new Date(),
    })
    this.messageIdCounter++
    return {
      success: true,
      messageId: `inmem-${this.messageIdCounter}`,
    }
  }

  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.sent.push({
      type: 'bulk',
      params,
      timestamp: new Date(),
    })
    return params.recipients.map((_, i) => {
      this.messageIdCounter++
      return {
        success: true,
        messageId: `inmem-${this.messageIdCounter}`,
      }
    })
  }

  // Test helper methods
  getSent(): SentEmail[] {
    return this.sent
  }

  clear(): void {
    this.sent = []
    this.messageIdCounter = 0
  }

  getLastSent(): SentEmail | undefined {
    return this.sent[this.sent.length - 1]
  }

  getSentCount(): number {
    return this.sent.length
  }
}
