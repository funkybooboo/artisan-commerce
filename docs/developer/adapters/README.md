# Adapter Pattern Documentation

Complete guide for implementing the adapter pattern in Artisan Commerce.

## Quick Navigation

### Getting Started
- **New to adapters?** Start with [ADR-005](../../../plans/decisions/ADR-005-adapter-architecture.md) to understand the architecture decision
- **Ready to implement?** Jump to the [Quick Reference](./quick-reference.md) for templates and checklists
- **Need detailed examples?** Read the [Complete Guide](./adapter-pattern-guide.md) with full EmailProvider implementation
- **Implementing other adapters?** See [Adapter Implementations](./adapter-implementations.md) for interface designs

### Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [ADR-005](../../../plans/decisions/ADR-005-adapter-architecture.md) | Architecture decision record | Understanding the "why" behind adapters |
| [Adapter Pattern Guide](./adapter-pattern-guide.md) | Complete implementation guide | First-time implementation, detailed reference |
| [Quick Reference](./quick-reference.md) | Templates and checklists | During implementation, quick lookup |
| [Adapter Implementations](./adapter-implementations.md) | Interface designs for all adapters | Designing new adapters |

## Overview

The adapter pattern provides a standardized way to integrate external services (email, payment, shipping, storage) while maintaining:

- **Zero vendor lock-in** - Switch providers by changing one environment variable
- **Cost optimization** - Move to cheaper providers as pricing changes
- **Testability** - Use in-memory implementations instead of mocks
- **Security** - Isolate third-party code behind interfaces
- **Maintainability** - Standard patterns AI assistants understand

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Services, Controllers, Business Logic)                │
└────────────────────┬────────────────────────────────────┘
                     │ depends on interface
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Adapter Interface                       │
│  (EmailProvider, PaymentProvider, etc.)                 │
└─────────────┬───────────────────────────────────────────┘
              │ implemented by
              ▼
┌──────────────────────────────────────────────────────────┐
│              Adapter Implementations                      │
│  • Production: ResendEmailProvider, StripePaymentProvider│
│  • Testing: InMemory, Mock, Recording, Stub             │
└──────────────────────────────────────────────────────────┘
              │ uses
              ▼
┌──────────────────────────────────────────────────────────┐
│                External Service APIs                      │
│  (Resend, Stripe, Shippo, Cloudflare R2)                │
└──────────────────────────────────────────────────────────┘
```

## Adapter Families

| Adapter | Purpose | Default Provider | Status |
|---------|---------|------------------|--------|
| **EmailProvider** | Transactional emails, templates | Resend | ✅ Reference implementation |
| **PaymentProvider** | Payment processing, refunds | Stripe | 📋 Interface defined |
| **ShippingProvider** | Label generation, tracking | Shippo | 📋 Interface defined |
| **FileStorageProvider** | File upload/download | Cloudflare R2 | 📋 Interface defined |
| **TaxCalculator** | Sales tax calculation | Stripe Tax | 📋 Interface defined |
| **AuthProvider** | Authentication, tokens | JWT | 📋 Interface defined |
| **TranslationProvider** | i18n, localization | JSON files | 📋 Interface defined |

## Key Concepts

### Naming Conventions

```typescript
// ✅ CORRECT
interface EmailProvider { }              // Interface: no prefix
class ResendEmailProvider { }            // Implementation: provider prefix
sendTransactional()                      // Method: verb

// ❌ WRONG
interface IEmailProvider { }             // No 'I' prefix
class EmailProviderResend { }            // Wrong order
email()                                  // Noun, not verb
```

### Four Test Implementations

Every adapter has four test doubles:

| Type | Purpose | When to Use |
|------|---------|-------------|
| **Mock** | Vitest/Jest mock functions | Unit tests with call verification |
| **InMemory** | Functional fake with state | Integration tests, E2E tests |
| **Recording** | Records calls and parameters | Verifying call sequences |
| **Stub** | Hardcoded responses | Simulating specific scenarios |

### Factory Pattern

Each adapter has a factory function that selects the implementation based on environment:

```typescript
// Automatically uses correct provider
const emailProvider = createEmailProvider(env)

// In production: env.EMAIL_PROVIDER=resend → ResendEmailProvider
// In tests: env.EMAIL_PROVIDER=inmemory → InMemoryEmailProvider
```

### Dependency Injection

The container wires everything together (composition root):

```typescript
// apps/workers/src/container.ts
export function createContainer(env: Env, tenantId: string) {
  const emailProvider = createEmailProvider(env)
  const paymentProvider = createPaymentProvider(env)
  
  const services = {
    order: new OrderService(orderRepo, paymentProvider, emailProvider)
  }
  
  return { adapters: { emailProvider, paymentProvider }, services }
}
```

## Implementation Workflow

### 1. Design Phase
- [ ] Read [ADR-005](../../../plans/decisions/ADR-005-adapter-architecture.md) for context
- [ ] Review [Adapter Implementations](./adapter-implementations.md) for interface design
- [ ] Study provider's API documentation
- [ ] Define interface methods (application needs, not provider capabilities)
- [ ] Define parameter and result types
- [ ] Define error classes

### 2. Test Implementations
- [ ] Implement InMemoryProvider with state tracking
- [ ] Implement MockProvider with Vitest mocks
- [ ] Implement RecordingProvider for call tracking
- [ ] Implement StubProvider for scenarios
- [ ] Write tests for test implementations

### 3. Production Implementation
- [ ] Implement first production provider (e.g., ResendEmailProvider)
- [ ] Add parameter validation
- [ ] Add error conversion (provider errors → standard errors)
- [ ] Handle rate limits and authentication
- [ ] Write integration tests (optional)

### 4. Factory & Integration
- [ ] Create factory function with provider selection
- [ ] Add configuration validation
- [ ] Add to container
- [ ] Update `.env.example`
- [ ] Update documentation

### 5. Testing
```typescript
// Unit test with mock
const mockEmail = createMockEmailProvider()
const service = new OrderService(repo, payment, mockEmail)
await service.processOrder('order-123')
expect(mockEmail.sendTransactional).toHaveBeenCalled()

// Integration test with InMemory
const emailProvider = new InMemoryEmailProvider()
const service = new OrderService(repo, payment, emailProvider)
await service.processOrder('order-123')
expect(emailProvider.getSent()).toHaveLength(1)
```

## Configuration

Each adapter is configured via environment variables:

```bash
# Provider selection
EMAIL_PROVIDER=resend        # Which provider to use

# Provider-specific credentials
RESEND_API_KEY=re_xxx        # Provider API key
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_FROM_NAME="My Store"

# Test environment (automatically set)
EMAIL_PROVIDER=inmemory      # Use in-memory for tests
```

## Testing Philosophy

**No Mocks Policy:** Prefer real in-memory implementations over mocks.

**Why?**
- Mocks test that you called a function, not that the system works
- Mocks couple tests to implementation
- Mocks break during refactoring

**When to use each:**

```typescript
// ✅ GOOD - InMemory for integration tests
test('order workflow sends emails', async () => {
  const emailProvider = new InMemoryEmailProvider()
  const service = new OrderService(repo, payment, emailProvider)
  
  await service.processOrder('order-123')
  
  const sent = emailProvider.getSent()
  expect(sent[0].params.subject).toBe('Order Confirmation')
})

// ⚠️ OK - Mock for unit tests with spies
test('order service calls email provider', async () => {
  const mockEmail = createMockEmailProvider()
  const service = new OrderService(repo, payment, mockEmail)
  
  await service.processOrder('order-123')
  
  expect(mockEmail.sendTransactional).toHaveBeenCalledWith({
    to: 'customer@example.com',
    subject: 'Order Confirmation'
  })
})

// ❌ BAD - Don't test implementation details
test('save method is called', async () => {
  const mockRepo = createMockRepository()
  await service.create(data, mockRepo)
  expect(mockRepo.save).toHaveBeenCalledTimes(1) // Tests wiring, not behavior
})
```

## Common Patterns

### Constructor Injection

```typescript
// ✅ CORRECT - Dependencies explicit
export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private payment: PaymentProvider,
    private email: EmailProvider
  ) {}
}

// ❌ WRONG - Hidden dependencies
export class OrderService {
  async processOrder() {
    const email = getEmailProvider() // Where did this come from?
  }
}
```

### Error Handling

```typescript
// Define custom errors
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

// Convert provider errors
try {
  await this.resend.emails.send({ ... })
} catch (err: any) {
  if (err.statusCode === 429) {
    throw new EmailRateLimitError('Rate limit exceeded', 'resend')
  }
  throw new EmailProviderError(err.message, 'UNKNOWN', 'resend', err)
}
```

### Validation

```typescript
// Validate at interface boundary
async sendTransactional(params: TransactionalEmailParams): Promise<EmailResult> {
  // Validate first
  if (!params.to) {
    throw new EmailValidationError('Recipient required', 'to', 'resend')
  }
  
  // Then proceed
  // ...
}
```

## Switching Providers

To switch from one provider to another (e.g., Resend → Mailgun):

1. **Implement new adapter** (~2-4 hours)
   ```bash
   # Create packages/adapters/src/email/mailgun.provider.ts
   ```

2. **Add to factory** (2 lines)
   ```typescript
   case 'mailgun':
     return new MailgunEmailProvider({ ... })
   ```

3. **Update environment** (1 line)
   ```bash
   EMAIL_PROVIDER=mailgun
   MAILGUN_API_KEY=your-key
   ```

4. **Deploy** (no code changes required)

**Result:** Zero application code changes needed!

## Troubleshooting

### "Provider not found" error
- Check `EMAIL_PROVIDER` environment variable
- Ensure it matches a case in factory switch statement
- Check for typos (case-sensitive)

### "API key required" error
- Check provider-specific environment variables
- For Resend: `RESEND_API_KEY`
- For Stripe: `STRIPE_SECRET_KEY`
- Ensure `.env` is loaded

### Tests failing in CI
- Ensure `EMAIL_PROVIDER=inmemory` in test environment
- Don't use real providers in tests
- Check for shared state between tests

### Rate limit errors
- Implement exponential backoff
- Use provider's test mode in development
- Check rate limits in provider dashboard

## Resources

### Internal Documentation
- [ADR-005: Adapter Architecture](../../../plans/decisions/ADR-005-adapter-architecture.md)
- [Testing Standards](../standards/testing.md)
- [Code Standards](../standards/code-standards.md)
- [Architecture Overview](../reference/architecture.md)

### External Resources
- [Ports and Adapters Pattern](https://alistair.cockburn.us/hexagonal-architecture/) - Alistair Cockburn
- [Dependency Injection](https://martinfowler.com/articles/injection.html) - Martin Fowler
- [Test Doubles](https://martinfowler.com/bliki/TestDouble.html) - Martin Fowler
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method) - Refactoring Guru

## Contributing

When adding a new adapter:

1. Follow the [Quick Reference](./quick-reference.md) templates
2. Use [EmailProvider](./adapter-pattern-guide.md#complete-example-emailprovider) as reference
3. Implement all four test doubles
4. Add comprehensive JSDoc documentation
5. Update this README with the new adapter
6. Update `.env.example` with configuration

## Questions?

- Read the [Complete Guide](./adapter-pattern-guide.md) for detailed examples
- Check [ADR-005](../../../plans/decisions/ADR-005-adapter-architecture.md) for architectural decisions
- See [Adapter Implementations](./adapter-implementations.md) for interface designs
- Use [Quick Reference](./quick-reference.md) during implementation

---

**Last Updated:** March 3, 2026  
**Status:** EmailProvider reference implementation complete, other adapters pending
