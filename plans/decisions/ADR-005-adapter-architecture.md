# ADR-005: Comprehensive Adapter Architecture for Zero Vendor Lock-in

## Status

Accepted

## Context

Artisan Commerce must avoid vendor lock-in to maintain portability and cost optimization. External dependencies (email, shipping, payment, storage, tax, authentication, translation) should be swappable without code changes.

**Core Requirements**:
- **Cheap**: Ability to switch to cheaper providers as costs change
- **Portable**: No vendor lock-in, can migrate to any provider
- **Secure**: Isolate third-party code, minimize attack surface
- **LLM-Friendly**: Use standard patterns AI assistants understand well

## Decision

Implement **comprehensive adapter pattern** for ALL external services using standard naming conventions.

### Naming Convention

**Interfaces**: No `I` prefix, just the role name
```typescript
// ✅ CORRECT
interface EmailProvider { }
interface ShippingProvider { }
interface PaymentProvider { }

// ❌ WRONG
interface IEmailProvider { }
interface BaseEmailProvider { }
interface AbstractEmailProvider { }
```

**Implementations**: Provider-specific prefix
```typescript
// ✅ CORRECT
class ResendEmailProvider implements EmailProvider { }
class MailgunEmailProvider implements EmailProvider { }
class ShippoShippingProvider implements ShippingProvider { }

// ❌ WRONG
class EmailProviderResend { }
class ResendEmail { }
```

### Core Adapters

1. **EmailProvider** (Resend → Mailgun/Postmark/SendGrid)
2. **ShippingProvider** (Shippo → EasyPost/USPS direct)
3. **PaymentProvider** (Stripe → Square/PayPal)
4. **TaxCalculator** (Stripe Tax → TaxJar/Avalara)
5. **FileStorage** (R2 → S3/GCS/local)
6. **AuthProvider** (Custom JWT → Auth0/Supabase)
7. **TranslationProvider** (JSON files → Lokalise/Phrase)
8. **Repository interfaces** (D1 → Postgres/MySQL)

### Interface Example

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
 * const provider = new ResendEmailProvider({ apiKey: env.RESEND_API_KEY })
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

export interface TransactionalEmailParams {
  to: string | string[]
  from?: string // Optional, uses default if not provided
  subject: string
  html: string
  text?: string // Plain text alternative
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
```

### Test Doubles (All Four Types)

Every adapter must have four test implementations:

```typescript
// 1. Mock (Vitest mock function, no implementation)
export const createMockEmailProvider = (): EmailProvider => ({
  sendTransactional: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' }),
  sendTemplate: vi.fn().mockResolvedValue({ success: true, messageId: 'mock-id' }),
  sendBulk: vi.fn().mockResolvedValue([{ success: true, messageId: 'mock-id' }])
})

// 2. InMemory (functional fake with in-memory state)
export class InMemoryEmailProvider implements EmailProvider {
  private sent: Array<{ type: string; params: unknown }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.sent.push({ type: 'transactional', params })
    return { success: true, messageId: `inmem-${this.sent.length}` }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.sent.push({ type: 'template', params })
    return { success: true, messageId: `inmem-${this.sent.length}` }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.sent.push({ type: 'bulk', params })
    return params.recipients.map((_, i) => ({
      success: true,
      messageId: `inmem-${this.sent.length}-${i}`
    }))
  }
  
  // Test helper methods
  getSent() { return this.sent }
  clear() { this.sent = [] }
  getLastSent() { return this.sent[this.sent.length - 1] }
}

// 3. Recording (captures calls for assertions)
export class RecordingEmailProvider implements EmailProvider {
  public calls: Array<{ method: string; args: unknown[] }> = []
  
  async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
    this.calls.push({ method: 'sendTransactional', args: [params] })
    return { success: true, messageId: 'recording-id' }
  }
  
  async sendTemplate(params: TemplateEmailParams): Promise<EmailResult> {
    this.calls.push({ method: 'sendTemplate', args: [params] })
    return { success: true, messageId: 'recording-id' }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    this.calls.push({ method: 'sendBulk', args: [params] })
    return params.recipients.map(() => ({ success: true, messageId: 'recording-id' }))
  }
  
  // Test helper methods
  getCalls() { return this.calls }
  getCallCount(method: string) {
    return this.calls.filter(c => c.method === method).length
  }
  clear() { this.calls = [] }
}

// 4. Stub (hardcoded responses, no logic)
export class StubEmailProvider implements EmailProvider {
  constructor(private responses: Partial<EmailResult> = {}) {}
  
  async sendTransactional(): Promise<EmailResult> {
    return { success: true, messageId: 'stub-id', ...this.responses }
  }
  
  async sendTemplate(): Promise<EmailResult> {
    return { success: true, messageId: 'stub-id', ...this.responses }
  }
  
  async sendBulk(params: BulkEmailParams): Promise<EmailResult[]> {
    return params.recipients.map(() => ({
      success: true,
      messageId: 'stub-id',
      ...this.responses
    }))
  }
}
```

### Factory Pattern (Environment-Based Selection)

```typescript
// packages/adapters/src/email/factory.ts

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
      
    case 'postmark':
      if (!env.POSTMARK_API_KEY) {
        throw new Error('POSTMARK_API_KEY is required')
      }
      return new PostmarkEmailProvider({
        apiKey: env.POSTMARK_API_KEY
      })
      
    case 'sendgrid':
      if (!env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY is required')
      }
      return new SendGridEmailProvider({
        apiKey: env.SENDGRID_API_KEY
      })
      
    case 'mock':
      return createMockEmailProvider()
      
    case 'inmemory':
      return new InMemoryEmailProvider()
      
    case 'recording':
      return new RecordingEmailProvider()
      
    case 'stub':
      return new StubEmailProvider()
      
    default:
      throw new Error(`Unknown email provider: ${provider}`)
  }
}
```

### Dependency Injection (Composition Root)

```typescript
// apps/workers/src/container.ts

/**
 * Create dependency injection container with all adapters and services.
 * 
 * This is the composition root - the only place that knows which concrete
 * implementations are used. All other code depends on interfaces.
 * 
 * @param env - Environment configuration (Cloudflare Workers env)
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @returns Container with all dependencies
 */
export function createContainer(env: Env, tenantId: string) {
  // Adapters (external services)
  const emailProvider = createEmailProvider(env)
  const shippingProvider = createShippingProvider(env)
  const paymentProvider = createPaymentProvider(env)
  const fileStorage = createFileStorage(env)
  const taxCalculator = createTaxCalculator(env)
  const authProvider = createAuthProvider(env)
  const translationProvider = createTranslationProvider(env)
  
  // Database
  const db = drizzle(env.DB)
  
  // Repositories (data access, tenant-scoped)
  const repositories = {
    users: new DrizzleUserRepository(db, tenantId),
    orders: new DrizzleOrderRepository(db, tenantId),
    projects: new DrizzleProjectRepository(db, tenantId),
    patterns: new DrizzlePatternRepository(db, tenantId),
    reviews: new DrizzleReviewRepository(db, tenantId),
    queue: new DrizzleQueueRepository(db, tenantId),
    discountCodes: new DrizzleDiscountCodeRepository(db, tenantId),
    messages: new DrizzleMessageRepository(db, tenantId),
    favorites: new DrizzleFavoriteRepository(db, tenantId),
    merch: new DrizzleMerchRepository(db, tenantId)
  }
  
  // Services (business logic)
  const services = {
    auth: new AuthService(authProvider, repositories.users),
    order: new OrderService(
      repositories.orders,
      paymentProvider,
      emailProvider,
      taxCalculator
    ),
    queue: new QueueService(repositories.queue, repositories.orders),
    shipping: new ShippingService(
      shippingProvider,
      repositories.orders,
      fileStorage
    ),
    project: new ProjectService(repositories.projects, fileStorage),
    pattern: new PatternService(repositories.patterns, fileStorage),
    review: new ReviewService(repositories.reviews, repositories.orders),
    message: new MessageService(repositories.messages, emailProvider)
  }
  
  return {
    adapters: {
      emailProvider,
      shippingProvider,
      paymentProvider,
      fileStorage,
      taxCalculator,
      authProvider,
      translationProvider
    },
    repositories,
    services
  }
}

// Type for the container
export type Container = ReturnType<typeof createContainer>
```

## Rationale

### Portability
- Change providers by changing environment variable only
- No code changes required when switching
- Can test multiple providers in parallel

### Cost Optimization
- Switch to cheaper providers as pricing changes
- Compare providers easily (run both in staging)
- No vendor lock-in prevents price gouging

### Testability
- Four test double types cover all testing scenarios
- Mock: Fast unit tests with Vitest spies
- InMemory: Integration tests with state inspection
- Recording: Verify call sequences and parameters
- Stub: Fixture data for specific test scenarios

### Security
- Isolate third-party code behind interfaces
- Minimize attack surface (only interface exposed)
- Easy to add security wrappers (rate limiting, validation)

### LLM-Friendly
- Standard design patterns (Factory, Dependency Injection)
- Well-documented interfaces with JSDoc
- Clear naming conventions
- AI assistants trained extensively on these patterns

## Consequences

### Positive
- **Zero vendor lock-in**: Switch providers in minutes
- **Easy testing**: Multiple test double types
- **Clear boundaries**: Separation of concerns enforced
- **Cost control**: Can always find cheaper alternatives
- **Security**: Third-party code isolated

### Negative
- **More upfront work**: Creating interfaces and adapters
- **Slight overhead**: Extra indirection (negligible performance impact)
- **More files**: Each adapter needs 5+ files (interface + implementations)

### Migration Path

**Switching providers** (e.g., Resend → Mailgun):

1. Implement new adapter: `packages/adapters/src/email/mailgun.provider.ts` (~100 lines)
2. Add to factory: Update switch statement (2 lines)
3. Write integration tests: Verify Mailgun adapter works
4. Update environment: `EMAIL_PROVIDER=mailgun`
5. Deploy to staging: Test with real Mailgun account
6. Deploy to production: Switch environment variable
7. Monitor: Verify emails sending correctly
8. Remove old adapter: Delete Resend files if unused

**Time estimate**: 2-4 hours (most time is testing)

**Code changes required**: Zero application code changes

## Documentation

Each adapter family documented with:

1. **ADR**: Design decisions and rationale (this document)
2. **Interface docs**: JSDoc with examples and error handling
3. **Migration guide**: Step-by-step provider switching
4. **Implementation guide**: How to add new providers

**Location**: `docs/developer/adapters/`

## References

- Ports and Adapters (Hexagonal Architecture) - Alistair Cockburn
- Dependency Injection Principles - Martin Fowler
- Factory Pattern - Gang of Four Design Patterns
- Repository Pattern - Domain-Driven Design (Eric Evans)
- Test Doubles - Gerard Meszaros, xUnit Test Patterns

## Related ADRs

- ADR-002: Technology Stack (Cloudflare serverless, SvelteKit)
- ADR-004: Database Choice (D1 with repository pattern)
- ADR-006: SvelteKit (framework portability)
