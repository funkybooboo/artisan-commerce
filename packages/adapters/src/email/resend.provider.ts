/**
 * Resend email provider implementation.
 * Production email service using Resend API.
 */

import { Resend } from 'resend'
import type { EmailProvider } from './index.js'
import {
  EmailProviderError,
  type BulkEmailParams,
  type EmailResult,
  type TemplateEmailParams,
  type TransactionalEmailParams,
} from './types.js'

export interface ResendEmailProviderConfig {
  apiKey: string
  fromAddress?: string
  fromName?: string
}

export class ResendEmailProvider implements EmailProvider {
  private client: Resend
  private defaultFrom: string

  constructor(config: ResendEmailProviderConfig) {
    if (!config.apiKey) {
      throw new EmailProviderError('Resend API key is required', 'MISSING_API_KEY', 'resend')
    }

    this.client = new Resend(config.apiKey)
    this.defaultFrom = config.fromAddress
      ? config.fromName
        ? `${config.fromName} <${config.fromAddress}>`
        : config.fromAddress
      : 'noreply@example.com'
  }

  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: params.from || this.defaultFrom,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        attachments: params.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType,
        })),
      })

      if (error) {
        throw new EmailProviderError(error.message, 'SEND_FAILED', 'resend')
      }

      return {
        success: true,
        messageId: data?.id || 'unknown',
      }
    } catch (error) {
      if (error instanceof EmailProviderError) {
        throw error
      }
      throw new EmailProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        'SEND_FAILED',
        'resend'
      )
    }
  }

  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    // Resend doesn't have built-in template support yet
    // For now, we'll throw an error. In the future, this could use
    // React Email or similar templating solution
    throw new EmailProviderError(
      'Template emails not yet supported with Resend provider',
      'NOT_IMPLEMENTED',
      'resend'
    )
  }

  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    // Resend batch API
    try {
      const { data, error } = await this.client.batch.send(
        params.recipients.map((recipient) => ({
          from: params.from || this.defaultFrom,
          to: [recipient.email],
          subject: 'Bulk Email', // Would come from template
          html: '<p>Bulk email content</p>', // Would come from template
        }))
      )

      if (error) {
        throw new EmailProviderError(error.message, 'BULK_SEND_FAILED', 'resend')
      }

      return (
        data?.map((item) => ({
          success: true,
          messageId: item.id || 'unknown',
        })) || []
      )
    } catch (error) {
      if (error instanceof EmailProviderError) {
        throw error
      }
      throw new EmailProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        'BULK_SEND_FAILED',
        'resend'
      )
    }
  }
}
