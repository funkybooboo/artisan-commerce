import { InMemoryEmailProvider } from '@artisan-commerce/adapters/email'
import { InMemoryEmailStore } from '@artisan-commerce/adapters/email'
import { beforeEach, describe, expect, it } from 'vitest'

describe('InMemoryEmailProvider', () => {
  let store: InMemoryEmailStore
  let provider: InMemoryEmailProvider

  beforeEach(() => {
    store = new InMemoryEmailStore()
    provider = new InMemoryEmailProvider(store)
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
      expect(store.getCount()).toBe(1)
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

      const sent = store.getAll()
      expect(sent).toHaveLength(2)
      expect(sent[0]?.type).toBe('transactional')
      expect(sent[1]?.type).toBe('transactional')
    })

    it('should support multiple recipients', async () => {
      const result = await provider.sendTransactional({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(result.success).toBe(true)
      expect(store.getAll()).toHaveLength(1)
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
      expect(store.getCount()).toBe(1)
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

      const sent = store.getAll()
      expect(sent).toHaveLength(2)
      expect(sent[0]?.type).toBe('transactional')
      expect(sent[1]?.type).toBe('template')
    })
  })

  describe('sendBulk', () => {
    it('should send bulk emails', async () => {
      const results = await provider.sendBulk({
        recipients: [{ email: 'test1@example.com' }, { email: 'test2@example.com' }],
        templateId: 'newsletter',
      })

      expect(results).toHaveLength(2)
      expect(results[0]?.success).toBe(true)
      expect(results[1]?.success).toBe(true)
      expect(store.getCount()).toBe(1) // Bulk counts as 1 send operation
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

  describe('store inspection', () => {
    it('should return last sent email via store', async () => {
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

      const last = store.getLast()
      expect(last?.type).toBe('transactional')
    })

    it('should clear sent emails via store', async () => {
      await provider.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })

      expect(store.getCount()).toBe(1)

      store.clear()

      expect(store.getCount()).toBe(0)
      expect(store.getAll()).toHaveLength(0)
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

    it('should use default store when none is injected', async () => {
      // Provider constructed with no args -- uses its own internal store.
      // No way to inspect it from outside -- that is the point.
      const standalone = new InMemoryEmailProvider()
      const result = await standalone.sendTransactional({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      })
      expect(result.success).toBe(true)
    })
  })
})
