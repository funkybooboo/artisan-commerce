# Adapter Pattern Implementation Guide

Complete guide for implementing the adapter pattern in TypeScript for external service providers in Artisan Commerce.

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Interface Design](#interface-design)
4. [Dependency Injection](#dependency-injection)
5. [Testing Strategy](#testing-strategy)
6. [Configuration](#configuration)
7. [Error Handling](#error-handling)
8. [Complete Example: EmailProvider](#complete-example-emailprovider)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

The adapter pattern allows us to:

- **Eliminate vendor lock-in** - Switch providers by changing one environment variable
- **Enable cost optimization** - Move to cheaper providers as pricing changes
- **Improve testability** - Use in-memory implementations instead of mocks
- **Isolate security risks** - Third-party code lives behind interface boundaries
- **Support LLM-friendly patterns** - Standard patterns AI assistants understand

### Adapter Families

1. **EmailProvider** - Transactional emails, templates, bulk sending
2. **PaymentProvider** - Payment processing, refunds, webhooks
3. **ShippingProvider** - Label generation, tracking, rate calculation
4. **FileStorageProvider** - Upload, download, delete, presigned URLs
5. **TaxCalculator** - Tax calculation, rate lookup
6. **AuthProvider** - Authentication, token management
7. **TranslationProvider** - i18n, localization

---

## Core Principles

### 1. Interface-First Design

Define the interface BEFORE implementing any adapter. The interface represents the contract - what the application needs, not what the provider offers.

```typescript
// ✅ CORRECT - Interface defines application needs
export interface EmailProvider {
  sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>
  sendTemplate(params: TemplateEmailParams): Promise<EmailResult>
  sendBulk(params: BulkEmailParams): Promise<EmailResult[]>
}

// ❌ WRONG - Leaking provider-specific methods
export interface EmailProvider {
  // Don't expose provider-specific APIs
  resendSend(data: ResendParams): Promise<ResendResponse>
}
```

### 2. Naming Conventions

**Interfaces:** No prefix, just the role name

```typescript
// ✅ CORRECT
EmailProvider
PaymentProvider
ShippingProvider

// ❌ WRONG
IEmailProvider       // No 'I' prefix
BaseEmailProvider    // No 'Base' prefix
AbstractEmailProvider // No 'Abstract' prefix
```

**Implementations:** Provider-specific prefix

```typescript
// ✅ CORRECT
ResendEmailProvider
MailgunEmailProvider
StripePaymentProvider

// ❌ WRONG
EmailProviderResend  // Wrong order
ResendEmail          // Missing 'Provider'
Resend               // Too generic
```

### 3. Fail-Fast Validation

Validate inputs at the interface boundary. Don't let invalid data propagate.

```typescript
export class ResendEmailProvider implements EmailProvider {
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    // Validate immediately
    if (!params.to) {
      throw new ValidationError('Email recipient is required', { field: 'to' })
    }
    if (!params.subject) {
      throw new ValidationError('Email subject is required', { field: 'subject' })
    }
    
    // Then proceed with provider call
    // ...
  }
}
```

### 4. No Shared State

Each adapter instance should be stateless or have isolated state. No global variables, no singletons that hold mutable state.

```typescript
// ✅ CORRECT - Configuration only, no mutable state
export class ResendEmailProvider implements EmailProvider {
  constructor(private config: ResendConfig) {}
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    // Each call is independent
  }
}

// ❌ WRONG - Shared mutable state
export class ResendEmailProvider implements EmailProvider {
  private sentEmails: EmailResult[] = [] // Don't do this!
}
```

---

## Interface Design

### Method Naming

Use verb phrases that describe the action from the application's perspective:

```typescript
// ✅ CORRECT
sendTransactional()    // Action is clear
calculateTax()         // What it does
generateLabel()        // Clear outcome
uploadFile()           // Direct action

// ❌ WRONG
email()                // Noun, not verb
process()              // Too generic
handle()               // Unclear
```

### Parameter Objects

Group related parameters into typed objects:

```typescript
// ✅ CORRECT - Single parameter object
interface TransactionalEmailParams {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  attachments?: EmailAttachment[]
}

async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>

// ❌ WRONG - Too many parameters
async sendTransactional(
  to: string,
  subject: string, 
  html: string,
  text?: string,
  from?: string,
  replyTo?: string
): Promise<EmailResult>
```

### Return Types

Make success and failure explicit:

```typescript
// ✅ CORRECT - Structured result
export interface EmailResult {
  success: boolean
  messageId: string
  error?: string
}

// Document what can go wrong
/**
 * @throws EmailProviderError if sending fails
 * @throws ValidationError if params are invalid
 */
async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>

// ❌ WRONG - Unclear success/failure
async sendTransactional(params: TransactionalEmailParams): Promise<string | null>
```

### Optional vs Required Fields

Make optionality explicit in the interface:

```typescript
export interface TransactionalEmailParams {
  // Required fields (no ?)
  to: string | string[]
  subject: string
  html: string
  
  // Optional fields (with ?)
  text?: string           // Defaults to stripped HTML
  from?: string           // Defaults to configured from address
  replyTo?: string        // No default
  attachments?: EmailAttachment[]
}
```

---

## Dependency Injection

### Factory Pattern

Each adapter family has a factory function that creates the appropriate implementation based on environment configuration:

```typescript
// packages/adapters/src/email/factory.ts

export function createEmailProvider(env: Env): EmailProvider {
  const provider = env.EMAIL_PROVIDER || 'resend'
  
  switch (provider) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is required for Resend provider')
      }
      return new ResendEmailProvider({
        apiKey: env.RESEND_API_KEY,
        fromAddress: env.EMAIL_FROM_ADDRESS,
        fromName: env.EMAIL_FROM_NAME
      })
      
    case 'mailgun':
      if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
        throw new Error('MAILGUN_API_KEY and MAILGUN_DOMAIN are required')
      }
      return new MailgunEmailProvider({
        apiKey: env.MAILGUN_API_KEY,
        domain: env.MAILGUN_DOMAIN
      })
      
    case 'inmemory':
      return new InMemoryEmailProvider()
      
    case 'mock':
      return createMockEmailProvider()
      
    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}
```

### Composition Root

The container is the single place where all dependencies are wired together:

```typescript
// apps/workers/src/container.ts

export function createContainer(env: Env, tenantId: string) {
  // Create all adapters using factories
  const emailProvider = createEmailProvider(env)
  const shippingProvider = createShippingProvider(env)
  const paymentProvider = createPaymentProvider(env)
  const fileStorage = createFileStorage(env)
  
  // Database connection
  const db = drizzle(env.DB)
  
  // Create repositories (data access layer)
  const repositories = {
    users: new DrizzleUserRepository(db, tenantId),
    orders: new DrizzleOrderRepository(db, tenantId),
    // ...
  }
  
  // Create services (business logic layer)
  const services = {
    order: new OrderService(
      repositories.orders,
      paymentProvider,
      emailProvider,
      shippingProvider
    ),
    // ...
  }
  
  return { adapters: { emailProvider, shippingProvider, paymentProvider }, repositories, services }
}

export type Container = ReturnType<typeof createContainer>
```

### Constructor Injection

Services receive dependencies through constructor parameters:

```typescript
// ✅ CORRECT - Dependencies injected
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private payment: PaymentProvider,
    private email: EmailProvider,
    private shipping: ShippingProvider
  ) {}
  
  async processOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId)
    await this.payment.charge(order.total)
    await this.email.sendTransactional({ /* ... */ })
    // ...
  }
}

// ❌ WRONG - Hidden dependencies
export class OrderService {
  async processOrder(orderId: string): Promise<Order> {
    const payment = getPaymentProvider() // Where did this come from?
    const email = getEmailProvider()     // Hidden global state
    // ...
  }
}
```

---

## Testing Strategy

### Four Types of Test Doubles

Every adapter MUST have four test implementations:

#### 1. Mock (Vitest/Jest mock functions)

Use for unit tests where you need to verify function calls with spies.

```typescript
// packages/adapters/src/email/mock.provider.ts

export const createMockEmailProvider = (): EmailProvider => ({
  sendTransactional: vi.fn().mockResolvedValue({ 
    success: true, 
    messageId: 'mock-id' 
  }),
  sendTemplate: vi.fn().mockResolvedValue({ 
    success: true, 
    messageId: 'mock-id' 
  }),
  sendBulk: vi.fn().mockResolvedValue([{ 
    success: true, 
    messageId: 'mock-id' 
  }])
})
```

**When to use:**
- Unit tests where you need to verify that a function was called
- Testing error handling paths
- Testing retry logic

**Example:**
```typescript
test('order service sends confirmation email', async () => {
  const mockEmail = createMockEmailProvider()
  const service = new OrderService(repo, payment, mockEmail, shipping)
  
  await service.processOrder('order-123')
  
  expect(mockEmail.sendTransactional).toHaveBeenCalledWith({
    to: 'customer@example.com',
    subject: 'Order Confirmation',
    // ...
  })
})
```

#### 2. InMemory (Functional fake)

Use for integration tests where you need to inspect state or test workflows.

```typescript
// packages/adapters/src/email/inmemory.provider.ts

export class InMemoryEmailProvider implements EmailProvider {
  private sent: Array<{ type: string; params: unknown; timestamp: Date }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.sent.push({ 
      type: 'transactional', 
      params, 
      timestamp: new Date() 
    })
    return { success: true, messageId: `inmem-${this.sent.length}` }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.sent.push({ 
      type: 'template', 
      params, 
      timestamp: new Date() 
    })
    return { success: true, messageId: `inmem-${this.sent.length}` }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.sent.push({ 
      type: 'bulk', 
      params, 
      timestamp: new Date() 
    })
    return params.recipients.map((_, i) => ({
      success: true,
      messageId: `inmem-${this.sent.length}-${i}`
    }))
  }
  
  // Test helper methods
  getSent() { return this.sent }
  getLastSent() { return this.sent[this.sent.length - 1] }
  getSentCount() { return this.sent.length }
  clear() { this.sent = [] }
  
  // Query helpers
  getSentTo(email: string) {
    return this.sent.filter(s => {
      const params = s.params as TransactionalEmailParams
      return params.to === email || (Array.isArray(params.to) && params.to.includes(email))
    })
  }
}
```

**When to use:**
- Integration tests that verify complete workflows
- Tests that need to inspect what was sent
- Tests that run multiple operations and check final state

**Example:**
```typescript
test('complete order workflow sends correct emails', async () => {
  const emailProvider = new InMemoryEmailProvider()
  const service = new OrderService(repo, payment, emailProvider, shipping)
  
  await service.processOrder('order-123')
  
  const sent = emailProvider.getSent()
  expect(sent).toHaveLength(2)
  expect(sent[0].type).toBe('transactional') // confirmation
  expect(sent[1].type).toBe('template')      // receipt
})
```

#### 3. Recording (Call recording)

Use when you need to verify exact call sequences and parameters.

```typescript
// packages/adapters/src/email/recording.provider.ts

export class RecordingEmailProvider implements EmailProvider {
  public calls: Array<{ method: string; args: unknown[]; timestamp: Date }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.calls.push({ 
      method: 'sendTransactional', 
      args: [params], 
      timestamp: new Date() 
    })
    return { success: true, messageId: 'recording-id' }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.calls.push({ 
      method: 'sendTemplate', 
      args: [params], 
      timestamp: new Date() 
    })
    return { success: true, messageId: 'recording-id' }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.calls.push({ 
      method: 'sendBulk', 
      args: [params], 
      timestamp: new Date() 
    })
    return params.recipients.map(() => ({ 
      success: true, 
      messageId: 'recording-id' 
    }))
  }
  
  // Test helper methods
  getCalls() { return this.calls }
  getCallCount(method?: string) {
    return method 
      ? this.calls.filter(c => c.method === method).length 
      : this.calls.length
  }
  getFirstCall() { return this.calls[0] }
  getLastCall() { return this.calls[this.calls.length - 1] }
  clear() { this.calls = [] }
}
```

**When to use:**
- Verifying order of operations
- Testing that methods are called with exact parameters
- Debugging test failures (inspect recorded calls)

#### 4. Stub (Hardcoded responses)

Use for tests that need specific responses without caring about implementation.

```typescript
// packages/adapters/src/email/stub.provider.ts

export class StubEmailProvider implements EmailProvider {
  constructor(private responses: Partial<EmailResult> = {}) {}
  
  async sendTransactional(): Promise<EmailResult> {
    return { 
      success: true, 
      messageId: 'stub-id', 
      ...this.responses 
    }
  }
  
  async sendTemplate(): Promise<EmailResult> {
    return { 
      success: true, 
      messageId: 'stub-id', 
      ...this.responses 
    }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    return params.recipients.map(() => ({
      success: true,
      messageId: 'stub-id',
      ...this.responses
    }))
  }
}

// Convenience factory for error scenarios
export const createFailingEmailProvider = (error: string) => {
  return new StubEmailProvider({ success: false, error, messageId: '' })
}
```

**When to use:**
- Tests that need specific response values
- Simulating error conditions
- Tests where you don't care about the call itself, just the result

**Example:**
```typescript
test('handles email provider failure gracefully', async () => {
  const failingEmail = createFailingEmailProvider('Rate limit exceeded')
  const service = new OrderService(repo, payment, failingEmail, shipping)
  
  await expect(service.processOrder('order-123'))
    .rejects.toThrow('Failed to send confirmation email')
})
```

### Testing Philosophy: No Mocks

This project follows a **no-mocks testing philosophy**. Use real in-memory implementations instead of mocks whenever possible.

**Why?**
- Mocks test that you called a function, not that the system works
- Mocks couple tests to implementation details
- Mocks break during refactoring when tests should provide safety

**When to use each type:**

| Test Type | Use Mock | Use InMemory | Use Recording | Use Stub |
|-----------|----------|--------------|---------------|----------|
| Unit | ✅ For call verification | ❌ Too much state | ❌ Overkill | ✅ For fixtures |
| Integration | ❌ Tests implementation | ✅ Test real behavior | ✅ Verify sequences | ❌ Too simplistic |
| E2E | ❌ Never | ✅ Full workflows | ❌ Unnecessary detail | ❌ Not realistic |

---

## Configuration

### Environment Variables

Each adapter is configured through environment variables:

```bash
# Provider selection (in .env)
EMAIL_PROVIDER=resend        # Which provider to use
RESEND_API_KEY=re_xxx        # Provider-specific credentials
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME="My Store"

# Test environment (automatically set by test runner)
EMAIL_PROVIDER=inmemory      # Use in-memory for tests
```

### Configuration Interface

Define a configuration interface for each provider:

```typescript
export interface EmailProviderConfig {
  apiKey: string
  fromAddress?: string
  fromName?: string
  timeout?: number
  retries?: number
}

export class ResendEmailProvider implements EmailProvider {
  private config: EmailProviderConfig
  
  constructor(config: EmailProviderConfig) {
    // Validate required fields
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    
    // Set defaults
    this.config = {
      fromAddress: 'noreply@example.com',
      fromName: 'Artisan Commerce',
      timeout: 10000,
      retries: 3,
      ...config
    }
  }
}
```

### Factory Validation

The factory function validates configuration before creating providers:

```typescript
export function createEmailProvider(env: Env): EmailProvider {
  const provider = env.EMAIL_PROVIDER || 'resend'
  
  // Test providers need no configuration
  if (['mock', 'inmemory', 'recording', 'stub'].includes(provider)) {
    return createTestProvider(provider)
  }
  
  // Production providers require credentials
  switch (provider) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error(
          'RESEND_API_KEY is required when EMAIL_PROVIDER=resend. ' +
          'Get your API key at https://resend.com/api-keys'
        )
      }
      return new ResendEmailProvider({
        apiKey: env.RESEND_API_KEY,
        fromAddress: env.EMAIL_FROM_ADDRESS,
        fromName: env.EMAIL_FROM_NAME
      })
      
    default:
      throw new Error(
        `Unknown email provider: ${provider}. ` +
        `Valid options: resend, mailgun, postmark, sendgrid, mock, inmemory`
      )
  }
}
```

---

## Error Handling

### Custom Error Classes

Define specific error types for each adapter family:

```typescript
// packages/adapters/src/email/errors.ts

export class EmailProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'EmailProviderError'
  }
}

export class EmailValidationError extends EmailProviderError {
  constructor(
    message: string,
    public field: string,
    provider: string
  ) {
    super(message, 'VALIDATION_ERROR', provider)
    this.name = 'EmailValidationError'
  }
}

export class EmailRateLimitError extends EmailProviderError {
  constructor(
    message: string,
    provider: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider)
    this.name = 'EmailRateLimitError'
  }
}
```

### Error Handling in Adapters

Catch provider-specific errors and convert to standard error types:

```typescript
export class ResendEmailProvider implements EmailProvider {
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    // Validate inputs first
    if (!params.to) {
      throw new EmailValidationError('Recipient is required', 'to', 'resend')
    }
    
    try {
      // Call provider API
      const result = await this.resend.emails.send({
        from: params.from || this.config.fromAddress,
        to: params.to,
        subject: params.subject,
        html: params.html
      })
      
      return { 
        success: true, 
        messageId: result.id 
      }
      
    } catch (err) {
      // Convert provider-specific errors to standard errors
      if (err.code === 'rate_limit_exceeded') {
        throw new EmailRateLimitError(
          'Email rate limit exceeded',
          'resend',
          err.retryAfter
        )
      }
      
      // Wrap unknown errors
      throw new EmailProviderError(
        `Failed to send email: ${err.message}`,
        err.code || 'UNKNOWN_ERROR',
        'resend',
        err
      )
    }
  }
}
```

### Error Documentation

Document what errors can be thrown:

```typescript
export interface EmailProvider {
  /**
   * Send a single transactional email.
   * 
   * @param params - Email parameters
   * @returns Result with message ID and status
   * @throws {EmailValidationError} if params are invalid
   * @throws {EmailRateLimitError} if rate limit is exceeded
   * @throws {EmailProviderError} for other provider errors
   * 
   * @example
   * try {
   *   await provider.sendTransactional({ to: '...', subject: '...', html: '...' })
   * } catch (err) {
   *   if (err instanceof EmailRateLimitError) {
   *     // Retry after err.retryAfter seconds
   *   } else {
   *     // Handle other errors
   *   }
   * }
   */
  sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>
}
```

---

## Complete Example: EmailProvider

This complete implementation serves as a template for all other adapters.

### Directory Structure

```
packages/adapters/src/email/
├── index.ts                    # Exports interface and types
├── resend.provider.ts          # Production implementation
├── inmemory.provider.ts        # In-memory test implementation
├── mock.provider.ts            # Mock test implementation
├── recording.provider.ts       # Recording test implementation
├── stub.provider.ts            # Stub test implementation
├── factory.ts                  # Factory function
├── errors.ts                   # Custom error classes
└── email.test.ts               # Adapter tests
```

### 1. Interface and Types (`index.ts`)

```typescript
// packages/adapters/src/email/index.ts

/**
 * Email provider interface for sending transactional and marketing emails.
 * 
 * All implementations must support:
 * - Transactional emails (order confirmations, shipping notifications)
 * - Template-based emails with variable substitution
 * - Bulk email sending for marketing campaigns
 * 
 * @example
 * const provider = createEmailProvider(env)
 * await provider.sendTransactional({
 *   to: 'customer@example.com',
 *   subject: 'Order Confirmation',
 *   html: '<p>Your order #123 has been confirmed.</p>'
 * })
 */
export interface EmailProvider {
  /**
   * Send a single transactional email.
   * 
   * @param params - Email parameters
   * @returns Result with message ID and status
   * @throws {EmailValidationError} if params are invalid
   * @throws {EmailRateLimitError} if rate limit is exceeded
   * @throws {EmailProviderError} for other provider errors
   */
  sendTransactional(params: TransactionalEmailParams): Promise<EmailResult>
  
  /**
   * Send an email using a predefined template.
   * 
   * @param params - Template parameters with variables
   * @returns Result with message ID and status
   * @throws {EmailValidationError} if params are invalid
   * @throws {EmailRateLimitError} if rate limit is exceeded
   * @throws {EmailProviderError} for other provider errors
   */
  sendTemplate(params: TemplateEmailParams): Promise<EmailResult>
  
  /**
   * Send bulk emails (marketing campaigns, announcements).
   * 
   * @param params - Bulk email parameters
   * @returns Results for each recipient
   * @throws {EmailValidationError} if params are invalid
   * @throws {EmailRateLimitError} if rate limit is exceeded
   * @throws {EmailProviderError} for other provider errors
   */
  sendBulk(params: BulkEmailParams): Promise<EmailResult[]>
}

/**
 * Parameters for sending a transactional email.
 */
export interface TransactionalEmailParams {
  /** Recipient email address(es) */
  to: string | string[]
  
  /** Email subject line */
  subject: string
  
  /** HTML email body */
  html: string
  
  /** Plain text alternative (optional, will be auto-generated from HTML if not provided) */
  text?: string
  
  /** Sender email address (optional, uses default if not provided) */
  from?: string
  
  /** Reply-to email address (optional) */
  replyTo?: string
  
  /** Email attachments (optional) */
  attachments?: EmailAttachment[]
  
  /** Custom headers (optional) */
  headers?: Record<string, string>
  
  /** Tags for categorization and analytics (optional) */
  tags?: string[]
}

/**
 * Parameters for sending a template-based email.
 */
export interface TemplateEmailParams {
  /** Recipient email address(es) */
  to: string | string[]
  
  /** Template identifier */
  templateId: string
  
  /** Variables to substitute in template */
  variables: Record<string, unknown>
  
  /** Sender email address (optional, uses default if not provided) */
  from?: string
  
  /** Reply-to email address (optional) */
  replyTo?: string
  
  /** Tags for categorization and analytics (optional) */
  tags?: string[]
}

/**
 * Parameters for sending bulk emails.
 */
export interface BulkEmailParams {
  /** List of recipients with optional per-recipient variables */
  recipients: Array<{
    email: string
    variables?: Record<string, unknown>
  }>
  
  /** Template identifier */
  templateId: string
  
  /** Sender email address (optional, uses default if not provided) */
  from?: string
  
  /** Tags for categorization and analytics (optional) */
  tags?: string[]
}

/**
 * Result from sending an email.
 */
export interface EmailResult {
  /** Whether the email was sent successfully */
  success: boolean
  
  /** Provider's message ID for tracking */
  messageId: string
  
  /** Error message if sending failed */
  error?: string
}

/**
 * Email attachment.
 */
export interface EmailAttachment {
  /** Filename as it should appear in the email */
  filename: string
  
  /** File content as Buffer or base64 string */
  content: Buffer | string
  
  /** MIME type (optional, will be inferred if not provided) */
  contentType?: string
}

/**
 * Configuration for email provider.
 */
export interface EmailProviderConfig {
  /** API key for the provider */
  apiKey: string
  
  /** Default sender email address */
  fromAddress?: string
  
  /** Default sender name */
  fromName?: string
  
  /** Request timeout in milliseconds */
  timeout?: number
  
  /** Number of retry attempts for failed requests */
  retries?: number
}

// Re-export error types
export * from './errors'

// Re-export factory
export { createEmailProvider } from './factory'
```

### 2. Error Classes (`errors.ts`)

```typescript
// packages/adapters/src/email/errors.ts

/**
 * Base error for all email provider errors.
 */
export class EmailProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'EmailProviderError'
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Error thrown when email parameters are invalid.
 */
export class EmailValidationError extends EmailProviderError {
  constructor(
    message: string,
    public field: string,
    provider: string
  ) {
    super(message, 'VALIDATION_ERROR', provider)
    this.name = 'EmailValidationError'
  }
}

/**
 * Error thrown when rate limit is exceeded.
 */
export class EmailRateLimitError extends EmailProviderError {
  constructor(
    message: string,
    provider: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider)
    this.name = 'EmailRateLimitError'
  }
}

/**
 * Error thrown when authentication fails.
 */
export class EmailAuthenticationError extends EmailProviderError {
  constructor(message: string, provider: string) {
    super(message, 'AUTHENTICATION_ERROR', provider)
    this.name = 'EmailAuthenticationError'
  }
}
```

### 3. Production Implementation (`resend.provider.ts`)

```typescript
// packages/adapters/src/email/resend.provider.ts

import { Resend } from 'resend'
import type {
  EmailProvider,
  EmailProviderConfig,
  TransactionalEmailParams,
  TemplateEmailParams,
  BulkEmailParams,
  EmailResult
} from './index'
import {
  EmailProviderError,
  EmailValidationError,
  EmailRateLimitError,
  EmailAuthenticationError
} from './errors'

/**
 * Resend email provider implementation.
 * 
 * @see https://resend.com/docs
 */
export class ResendEmailProvider implements EmailProvider {
  private resend: Resend
  private config: Required<EmailProviderConfig>
  
  constructor(config: EmailProviderConfig) {
    // Validate required configuration
    if (!config.apiKey) {
      throw new Error('Resend API key is required')
    }
    
    // Set defaults
    this.config = {
      apiKey: config.apiKey,
      fromAddress: config.fromAddress || 'noreply@example.com',
      fromName: config.fromName || 'Artisan Commerce',
      timeout: config.timeout || 10000,
      retries: config.retries || 3
    }
    
    // Initialize Resend client
    this.resend = new Resend(this.config.apiKey)
  }
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    // Validate parameters
    this.validateTransactionalParams(params)
    
    try {
      const result = await this.resend.emails.send({
        from: this.formatFrom(params.from),
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        attachments: params.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType
        })),
        headers: params.headers,
        tags: params.tags?.map(tag => ({ name: tag, value: 'true' }))
      })
      
      return {
        success: true,
        messageId: result.id
      }
      
    } catch (err: any) {
      throw this.handleError(err)
    }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    // Validate parameters
    this.validateTemplateParams(params)
    
    try {
      // Resend doesn't have built-in template support,
      // so we'd need to fetch the template and render it
      // For now, throw an error to implement this properly
      throw new Error('Template support not yet implemented for Resend')
      
    } catch (err: any) {
      throw this.handleError(err)
    }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    // Validate parameters
    this.validateBulkParams(params)
    
    try {
      // Send emails in parallel (Resend supports batch sending)
      const promises = params.recipients.map(recipient =>
        this.sendTemplate({
          to: recipient.email,
          templateId: params.templateId,
          variables: recipient.variables || {},
          from: params.from,
          tags: params.tags
        })
      )
      
      return await Promise.all(promises)
      
    } catch (err: any) {
      throw this.handleError(err)
    }
  }
  
  /**
   * Format sender address with optional name.
   */
  private formatFrom(from?: string): string {
    const address = from || this.config.fromAddress
    return `${this.config.fromName} <${address}>`
  }
  
  /**
   * Validate transactional email parameters.
   */
  private validateTransactionalParams(params: TransactionalEmailParams): void {
    if (!params.to || (Array.isArray(params.to) && params.to.length === 0)) {
      throw new EmailValidationError('Recipient is required', 'to', 'resend')
    }
    
    if (!params.subject || params.subject.trim() === '') {
      throw new EmailValidationError('Subject is required', 'subject', 'resend')
    }
    
    if (!params.html || params.html.trim() === '') {
      throw new EmailValidationError('HTML body is required', 'html', 'resend')
    }
  }
  
  /**
   * Validate template email parameters.
   */
  private validateTemplateParams(params: TemplateEmailParams): void {
    if (!params.to || (Array.isArray(params.to) && params.to.length === 0)) {
      throw new EmailValidationError('Recipient is required', 'to', 'resend')
    }
    
    if (!params.templateId || params.templateId.trim() === '') {
      throw new EmailValidationError('Template ID is required', 'templateId', 'resend')
    }
  }
  
  /**
   * Validate bulk email parameters.
   */
  private validateBulkParams(params: BulkEmailParams): void {
    if (!params.recipients || params.recipients.length === 0) {
      throw new EmailValidationError('At least one recipient is required', 'recipients', 'resend')
    }
    
    if (!params.templateId || params.templateId.trim() === '') {
      throw new EmailValidationError('Template ID is required', 'templateId', 'resend')
    }
  }
  
  /**
   * Convert Resend errors to standard error types.
   */
  private handleError(err: any): Error {
    // Rate limit errors
    if (err.statusCode === 429 || err.code === 'rate_limit_exceeded') {
      return new EmailRateLimitError(
        err.message || 'Rate limit exceeded',
        'resend',
        err.retryAfter
      )
    }
    
    // Authentication errors
    if (err.statusCode === 401 || err.statusCode === 403) {
      return new EmailAuthenticationError(
        'Invalid API key or insufficient permissions',
        'resend'
      )
    }
    
    // Validation errors
    if (err.statusCode === 400) {
      return new EmailValidationError(
        err.message || 'Invalid request',
        'unknown',
        'resend'
      )
    }
    
    // Generic provider error
    return new EmailProviderError(
      err.message || 'Failed to send email',
      err.code || 'UNKNOWN_ERROR',
      'resend',
      err
    )
  }
}
```

### 4. In-Memory Implementation (`inmemory.provider.ts`)

```typescript
// packages/adapters/src/email/inmemory.provider.ts

import type {
  EmailProvider,
  TransactionalEmailParams,
  TemplateEmailParams,
  BulkEmailParams,
  EmailResult
} from './index'

/**
 * In-memory email provider for testing.
 * 
 * Records all sent emails and provides test helper methods.
 */
export class InMemoryEmailProvider implements EmailProvider {
  private sent: Array<{
    type: 'transactional' | 'template' | 'bulk'
    params: TransactionalEmailParams | TemplateEmailParams | BulkEmailParams
    timestamp: Date
  }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.sent.push({
      type: 'transactional',
      params,
      timestamp: new Date()
    })
    
    return {
      success: true,
      messageId: `inmem-${this.sent.length}`
    }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.sent.push({
      type: 'template',
      params,
      timestamp: new Date()
    })
    
    return {
      success: true,
      messageId: `inmem-${this.sent.length}`
    }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.sent.push({
      type: 'bulk',
      params,
      timestamp: new Date()
    })
    
    return params.recipients.map((_, i) => ({
      success: true,
      messageId: `inmem-${this.sent.length}-${i}`
    }))
  }
  
  // Test helper methods
  
  /** Get all sent emails */
  getSent() {
    return this.sent
  }
  
  /** Get the last sent email */
  getLastSent() {
    return this.sent[this.sent.length - 1]
  }
  
  /** Get count of sent emails */
  getSentCount() {
    return this.sent.length
  }
  
  /** Clear all sent emails */
  clear() {
    this.sent = []
  }
  
  /** Get emails sent to a specific address */
  getSentTo(email: string) {
    return this.sent.filter(s => {
      if (s.type === 'transactional') {
        const params = s.params as TransactionalEmailParams
        return params.to === email || 
               (Array.isArray(params.to) && params.to.includes(email))
      }
      if (s.type === 'template') {
        const params = s.params as TemplateEmailParams
        return params.to === email || 
               (Array.isArray(params.to) && params.to.includes(email))
      }
      if (s.type === 'bulk') {
        const params = s.params as BulkEmailParams
        return params.recipients.some(r => r.email === email)
      }
      return false
    })
  }
  
  /** Get emails of a specific type */
  getSentByType(type: 'transactional' | 'template' | 'bulk') {
    return this.sent.filter(s => s.type === type)
  }
}
```

### 5. Mock Implementation (`mock.provider.ts`)

```typescript
// packages/adapters/src/email/mock.provider.ts

import { vi } from 'vitest'
import type { EmailProvider } from './index'

/**
 * Create a mock email provider for unit tests.
 * 
 * Uses Vitest mock functions to allow call verification.
 */
export const createMockEmailProvider = (): EmailProvider => ({
  sendTransactional: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-transactional-id'
  }),
  
  sendTemplate: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-template-id'
  }),
  
  sendBulk: vi.fn().mockImplementation((params) => 
    Promise.resolve(
      params.recipients.map((_, i) => ({
        success: true,
        messageId: `mock-bulk-id-${i}`
      }))
    )
  )
})
```

### 6. Recording Implementation (`recording.provider.ts`)

```typescript
// packages/adapters/src/email/recording.provider.ts

import type {
  EmailProvider,
  TransactionalEmailParams,
  TemplateEmailParams,
  BulkEmailParams,
  EmailResult
} from './index'

/**
 * Recording email provider for testing.
 * 
 * Records all method calls with parameters for assertion.
 */
export class RecordingEmailProvider implements EmailProvider {
  public calls: Array<{
    method: 'sendTransactional' | 'sendTemplate' | 'sendBulk'
    args: any[]
    timestamp: Date
  }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.calls.push({
      method: 'sendTransactional',
      args: [params],
      timestamp: new Date()
    })
    
    return {
      success: true,
      messageId: 'recording-id'
    }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.calls.push({
      method: 'sendTemplate',
      args: [params],
      timestamp: new Date()
    })
    
    return {
      success: true,
      messageId: 'recording-id'
    }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.calls.push({
      method: 'sendBulk',
      args: [params],
      timestamp: new Date()
    })
    
    return params.recipients.map(() => ({
      success: true,
      messageId: 'recording-id'
    }))
  }
  
  // Test helper methods
  
  /** Get all recorded calls */
  getCalls() {
    return this.calls
  }
  
  /** Get number of calls to a specific method */
  getCallCount(method?: 'sendTransactional' | 'sendTemplate' | 'sendBulk') {
    return method
      ? this.calls.filter(c => c.method === method).length
      : this.calls.length
  }
  
  /** Get the first call */
  getFirstCall() {
    return this.calls[0]
  }
  
  /** Get the last call */
  getLastCall() {
    return this.calls[this.calls.length - 1]
  }
  
  /** Clear all recorded calls */
  clear() {
    this.calls = []
  }
}
```

### 7. Stub Implementation (`stub.provider.ts`)

```typescript
// packages/adapters/src/email/stub.provider.ts

import type {
  EmailProvider,
  TransactionalEmailParams,
  TemplateEmailParams,
  BulkEmailParams,
  EmailResult
} from './index'

/**
 * Stub email provider for testing with hardcoded responses.
 */
export class StubEmailProvider implements EmailProvider {
  constructor(private responses: Partial<EmailResult> = {}) {}
  
  async sendTransactional(_params: TransactionalEmailParams): Promise<EmailResult> {
    return {
      success: true,
      messageId: 'stub-id',
      ...this.responses
    }
  }
  
  async sendTemplate(_params: TemplateEmailParams): Promise<EmailResult> {
    return {
      success: true,
      messageId: 'stub-id',
      ...this.responses
    }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    return params.recipients.map(() => ({
      success: true,
      messageId: 'stub-id',
      ...this.responses
    }))
  }
}

/**
 * Create a stub provider that always fails.
 */
export const createFailingEmailProvider = (error: string) => {
  return new StubEmailProvider({
    success: false,
    error,
    messageId: ''
  })
}

/**
 * Create a stub provider with a specific message ID.
 */
export const createStubEmailProviderWithId = (messageId: string) => {
  return new StubEmailProvider({
    success: true,
    messageId
  })
}
```

### 8. Factory Function (`factory.ts`)

```typescript
// packages/adapters/src/email/factory.ts

import type { EmailProvider } from './index'
import { ResendEmailProvider } from './resend.provider'
import { InMemoryEmailProvider } from './inmemory.provider'
import { RecordingEmailProvider } from './recording.provider'
import { StubEmailProvider } from './stub.provider'
import { createMockEmailProvider } from './mock.provider'

/**
 * Environment variables for email configuration.
 */
export interface Env {
  EMAIL_PROVIDER?: string
  RESEND_API_KEY?: string
  EMAIL_FROM_ADDRESS?: string
  EMAIL_FROM_NAME?: string
  MAILGUN_API_KEY?: string
  MAILGUN_DOMAIN?: string
  POSTMARK_API_KEY?: string
  SENDGRID_API_KEY?: string
}

/**
 * Create an email provider based on environment configuration.
 * 
 * Supported providers:
 * - resend: Resend.com (production default)
 * - mailgun: Mailgun
 * - postmark: Postmark
 * - sendgrid: SendGrid
 * - mock: Mock provider for unit tests
 * - inmemory: In-memory provider for integration tests
 * - recording: Recording provider for test assertions
 * - stub: Stub provider for test fixtures
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
export function createEmailProvider(env: Env): EmailProvider {
  const provider = env.EMAIL_PROVIDER || 'resend'
  
  // Test providers (no configuration needed)
  switch (provider) {
    case 'mock':
      return createMockEmailProvider()
      
    case 'inmemory':
      return new InMemoryEmailProvider()
      
    case 'recording':
      return new RecordingEmailProvider()
      
    case 'stub':
      return new StubEmailProvider()
  }
  
  // Production providers (require credentials)
  switch (provider) {
    case 'resend':
      if (!env.RESEND_API_KEY) {
        throw new Error(
          'RESEND_API_KEY is required when EMAIL_PROVIDER=resend. ' +
          'Get your API key at https://resend.com/api-keys'
        )
      }
      return new ResendEmailProvider({
        apiKey: env.RESEND_API_KEY,
        fromAddress: env.EMAIL_FROM_ADDRESS,
        fromName: env.EMAIL_FROM_NAME
      })
      
    case 'mailgun':
      if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
        throw new Error(
          'MAILGUN_API_KEY and MAILGUN_DOMAIN are required when EMAIL_PROVIDER=mailgun'
        )
      }
      // Implementation would go here
      throw new Error('Mailgun provider not yet implemented')
      
    case 'postmark':
      if (!env.POSTMARK_API_KEY) {
        throw new Error(
          'POSTMARK_API_KEY is required when EMAIL_PROVIDER=postmark'
        )
      }
      // Implementation would go here
      throw new Error('Postmark provider not yet implemented')
      
    case 'sendgrid':
      if (!env.SENDGRID_API_KEY) {
        throw new Error(
          'SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid'
        )
      }
      // Implementation would go here
      throw new Error('SendGrid provider not yet implemented')
      
    default:
      throw new Error(
        `Unknown email provider: ${provider}. ` +
        `Valid options: resend, mailgun, postmark, sendgrid, mock, inmemory, recording, stub`
      )
  }
}
```

### 9. Tests (`email.test.ts`)

```typescript
// packages/adapters/src/email/email.test.ts

import { describe, test, expect, beforeEach } from 'vitest'
import { InMemoryEmailProvider } from './inmemory.provider'
import { RecordingEmailProvider } from './recording.provider'
import { StubEmailProvider, createFailingEmailProvider } from './stub.provider'
import { createMockEmailProvider } from './mock.provider'
import type { TransactionalEmailParams } from './index'

describe('InMemoryEmailProvider', () => {
  let provider: InMemoryEmailProvider
  
  beforeEach(() => {
    provider = new InMemoryEmailProvider()
  })
  
  test('sends transactional email and records it', async () => {
    const params: TransactionalEmailParams = {
      to: 'customer@example.com',
      subject: 'Order Confirmation',
      html: '<p>Your order has been confirmed.</p>'
    }
    
    const result = await provider.sendTransactional(params)
    
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('inmem-1')
    
    const sent = provider.getSent()
    expect(sent).toHaveLength(1)
    expect(sent[0].type).toBe('transactional')
    expect(sent[0].params).toEqual(params)
  })
  
  test('records multiple emails', async () => {
    await provider.sendTransactional({
      to: 'test1@example.com',
      subject: 'Test 1',
      html: '<p>Test 1</p>'
    })
    
    await provider.sendTransactional({
      to: 'test2@example.com',
      subject: 'Test 2',
      html: '<p>Test 2</p>'
    })
    
    expect(provider.getSentCount()).toBe(2)
    expect(provider.getLastSent().params.to).toBe('test2@example.com')
  })
  
  test('filters emails by recipient', async () => {
    await provider.sendTransactional({
      to: 'alice@example.com',
      subject: 'For Alice',
      html: '<p>Hello Alice</p>'
    })
    
    await provider.sendTransactional({
      to: 'bob@example.com',
      subject: 'For Bob',
      html: '<p>Hello Bob</p>'
    })
    
    const aliceEmails = provider.getSentTo('alice@example.com')
    expect(aliceEmails).toHaveLength(1)
    expect(aliceEmails[0].params.subject).toBe('For Alice')
  })
  
  test('clears sent emails', async () => {
    await provider.sendTransactional({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
    
    expect(provider.getSentCount()).toBe(1)
    
    provider.clear()
    
    expect(provider.getSentCount()).toBe(0)
  })
})

describe('RecordingEmailProvider', () => {
  let provider: RecordingEmailProvider
  
  beforeEach(() => {
    provider = new RecordingEmailProvider()
  })
  
  test('records method calls', async () => {
    const params: TransactionalEmailParams = {
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }
    
    await provider.sendTransactional(params)
    
    const calls = provider.getCalls()
    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe('sendTransactional')
    expect(calls[0].args[0]).toEqual(params)
  })
  
  test('counts calls by method', async () => {
    await provider.sendTransactional({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
    
    await provider.sendTemplate({
      to: 'test@example.com',
      templateId: 'welcome',
      variables: {}
    })
    
    expect(provider.getCallCount()).toBe(2)
    expect(provider.getCallCount('sendTransactional')).toBe(1)
    expect(provider.getCallCount('sendTemplate')).toBe(1)
  })
})

describe('StubEmailProvider', () => {
  test('returns success by default', async () => {
    const provider = new StubEmailProvider()
    
    const result = await provider.sendTransactional({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
    
    expect(result.success).toBe(true)
    expect(result.messageId).toBe('stub-id')
  })
  
  test('returns custom responses', async () => {
    const provider = new StubEmailProvider({
      success: true,
      messageId: 'custom-123'
    })
    
    const result = await provider.sendTransactional({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
    
    expect(result.messageId).toBe('custom-123')
  })
  
  test('can simulate failures', async () => {
    const provider = createFailingEmailProvider('Rate limit exceeded')
    
    const result = await provider.sendTransactional({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Rate limit exceeded')
  })
})

describe('MockEmailProvider', () => {
  test('allows call verification', async () => {
    const provider = createMockEmailProvider()
    
    const params: TransactionalEmailParams = {
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }
    
    await provider.sendTransactional(params)
    
    expect(provider.sendTransactional).toHaveBeenCalledWith(params)
    expect(provider.sendTransactional).toHaveBeenCalledTimes(1)
  })
})
```

---

## Implementation Checklist

When implementing a new adapter, use this checklist:

### Phase 1: Design

- [ ] Define the interface (`index.ts`)
  - [ ] Method names are verbs describing application needs
  - [ ] Parameter objects group related data
  - [ ] Return types make success/failure explicit
  - [ ] All methods documented with JSDoc
  - [ ] Examples provided
- [ ] Define custom error classes (`errors.ts`)
  - [ ] Base error class extends Error
  - [ ] Specific error types for different failures
  - [ ] Error codes are constants
- [ ] Define configuration interface
  - [ ] Required fields marked clearly
  - [ ] Optional fields have sensible defaults
  - [ ] Validation logic documented

### Phase 2: Test Implementations

- [ ] InMemory implementation (`inmemory.provider.ts`)
  - [ ] Implements full interface
  - [ ] Records all operations
  - [ ] Provides query helper methods
  - [ ] State can be cleared between tests
- [ ] Mock implementation (`mock.provider.ts`)
  - [ ] Uses Vitest mock functions
  - [ ] Reasonable default return values
  - [ ] Allows custom return values
- [ ] Recording implementation (`recording.provider.ts`)
  - [ ] Records method calls with parameters
  - [ ] Provides call count methods
  - [ ] Can query calls by method name
- [ ] Stub implementation (`stub.provider.ts`)
  - [ ] Configurable responses
  - [ ] Factory functions for common scenarios
  - [ ] Minimal logic

### Phase 3: Production Implementation

- [ ] First production adapter (e.g., `resend.provider.ts`)
  - [ ] Implements full interface
  - [ ] Validates parameters
  - [ ] Converts provider errors to standard errors
  - [ ] Handles rate limits
  - [ ] Handles authentication errors
  - [ ] Uses configuration from constructor
  - [ ] No shared mutable state

### Phase 4: Factory & Integration

- [ ] Factory function (`factory.ts`)
  - [ ] Switch statement for provider selection
  - [ ] Validates required configuration
  - [ ] Clear error messages
  - [ ] Defaults to production provider
- [ ] Tests (`*.test.ts`)
  - [ ] Test each test implementation
  - [ ] Test error handling
  - [ ] Test configuration validation
  - [ ] Integration tests with real provider (optional)
- [ ] Container integration
  - [ ] Add factory call to container
  - [ ] Pass to services that need it
- [ ] Environment variables
  - [ ] Add to `.env.example`
  - [ ] Document in comments
  - [ ] Include example values

### Phase 5: Documentation

- [ ] Update adapter architecture ADR
- [ ] Add migration guide
- [ ] Document provider-specific quirks
- [ ] Add troubleshooting section

---

## Quick Reference

### When to Use Each Test Double

| Scenario | Use This |
|----------|----------|
| Verify a function was called with specific args | Mock |
| Test complete workflows with state inspection | InMemory |
| Verify exact call sequences and parameters | Recording |
| Simulate specific response scenarios | Stub |
| Integration tests with real behavior | InMemory |
| E2E tests with full workflows | InMemory |

### Naming Checklist

- [ ] Interface has no prefix (`EmailProvider`, not `IEmailProvider`)
- [ ] Implementation has provider prefix (`ResendEmailProvider`)
- [ ] Methods are verbs (`sendTransactional`, not `email`)
- [ ] Booleans are questions (`success`, not `successful`)
- [ ] Parameters use full words (`recipients`, not `rcpts`)

### Error Handling Checklist

- [ ] Custom error classes defined
- [ ] Errors documented in JSDoc with `@throws`
- [ ] Provider errors converted to standard errors
- [ ] Rate limits handled specially
- [ ] Authentication errors handled specially
- [ ] Original error included as `cause`

---

## Next Steps

1. **Implement PaymentProvider** following this same pattern
2. **Implement ShippingProvider** following this same pattern
3. **Implement FileStorageProvider** following this same pattern
4. **Add migration guide** for switching providers
5. **Add monitoring** for provider health and errors
