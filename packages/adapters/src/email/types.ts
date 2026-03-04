/**
 * Email provider types for Artisan Commerce
 */

export interface TransactionalEmailParams {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

export interface TemplateEmailParams {
  to: string | string[]
  templateId: string
  variables: Record<string, unknown>
  from?: string
  replyTo?: string
}

export interface BulkEmailParams {
  recipients: Array<{ email: string; variables?: Record<string, unknown> }>
  templateId: string
  from?: string
}

export interface EmailResult {
  success: boolean
  messageId: string
  error?: string
}

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
}

export class EmailProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string
  ) {
    super(message)
    this.name = 'EmailProviderError'
  }
}
