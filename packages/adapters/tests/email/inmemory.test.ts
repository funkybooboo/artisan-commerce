import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryEmailProvider } from '../../src/email/inmemory.provider.js'

describe('InMemoryEmailProvider', () => {
  let provider: InMemoryEmailProvider

  beforeEach(() => {
    provider = new InMemoryEmailProvider()
  })

  describe('sendTransactional', () => {
    it('should send transactional email', async () => {
      const result = await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toMatch(/^inmem-/)
      expect(provider.getSentCount()).toBe(1)
    })

    it('should track sent emails', async () => {
      await provider.sendTransactional({
        to: 'test1@example.com',
        subject: 'Test 1',
        html: '<p>Hello 1</p>',
      })
      await provider.sendTransactional({
        to: 'test2@example.com',
        subject: 'Test 2',
        html: '<p>Hello 2</p>',
      })

      const sent = provider.getSent()
      expect(sent).toHaveLength(2)
      expect(sent[0].type).toBe('transactional')
      expect(sent[1].type).toBe('transactional')
    })

    it('should support multiple recipients', async () => {
      const result = await provider.sendTransactional({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result.success).toBe(true)
      const sent = provider.getSent()
      expect(sent).toHaveLength(1)
    })

    it('should support optional fields', async () => {
      const result = await provider.sendTransactional({
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
        text: 'Hello',
        replyTo: 'reply@example.com',
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test'),
            contentType: 'application/pdf',
          },
        ],
      })

      expect(result.success).toBe(true)
    })
  })

  describe('sendTemplate', () => {
    it('should send template email', async () => {
      const result = await provider.sendTemplate({
        to: 'test@example.com',
        templateId: 'welcome',
        variables: { name: 'John' },
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toMatch(/^inmem-/)
      expect(provider.getSentCount()).toBe(1)
    })

    it('should track template emails separately', async () => {
      await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })
      await provider.sendTemplate({
        to: 'test@example.com',
        templateId: 'welcome',
        variables: {},
      })

      const sent = provider.getSent()
      expect(sent).toHaveLength(2)
      expect(sent[0].type).toBe('transactional')
      expect(sent[1].type).toBe('template')
    })
  })

  describe('sendBulk', () => {
    it('should send bulk emails', async () => {
      const results = await provider.sendBulk({
        recipients: [{ email: 'test1@example.com' }, { email: 'test2@example.com' }],
        templateId: 'newsletter',
      })

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(provider.getSentCount()).toBe(1) // Bulk counts as 1 send operation
    })

    it('should support variables per recipient', async () => {
      const results = await provider.sendBulk({
        recipients: [
          { email: 'test1@example.com', variables: { name: 'John' } },
          { email: 'test2@example.com', variables: { name: 'Jane' } },
        ],
        templateId: 'newsletter',
      })

      expect(results).toHaveLength(2)
    })
  })

  describe('helper methods', () => {
    it('should return last sent email', async () => {
      await provider.sendTransactional({
        to: 'test1@example.com',
        subject: 'Test 1',
        html: '<p>Hello 1</p>',
      })
      await provider.sendTransactional({
        to: 'test2@example.com',
        subject: 'Test 2',
        html: '<p>Hello 2</p>',
      })

      const last = provider.getLastSent()
      expect(last?.type).toBe('transactional')
    })

    it('should clear sent emails', async () => {
      await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(provider.getSentCount()).toBe(1)

      provider.clear()

      expect(provider.getSentCount()).toBe(0)
      expect(provider.getSent()).toHaveLength(0)
    })

    it('should increment message IDs', async () => {
      const result1 = await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })
      const result2 = await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result1.messageId).toBe('inmem-1')
      expect(result2.messageId).toBe('inmem-2')
    })
  })
})
