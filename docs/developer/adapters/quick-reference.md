# Adapter Pattern Quick Reference

Quick reference for implementing adapters in TypeScript. See [adapter-pattern-guide.md](./adapter-pattern-guide.md) for the complete guide.

## File Structure

```
packages/adapters/src/{adapter-name}/
├── index.ts                 # Interface, types, exports
├── {provider}.provider.ts   # Production implementation
├── inmemory.provider.ts     # In-memory test implementation
├── mock.provider.ts         # Mock test implementation
├── recording.provider.ts    # Recording test implementation
├── stub.provider.ts         # Stub test implementation
├── factory.ts               # Factory function
├── errors.ts                # Custom error classes
└── {adapter}.test.ts        # Tests
```

## Naming Conventions

```typescript
// ✅ CORRECT
interface EmailProvider { }           // No prefix
class ResendEmailProvider { }         // Provider-specific prefix
sendTransactional()                   // Verb for methods

// ❌ WRONG
interface IEmailProvider { }          // No 'I' prefix
class EmailProviderResend { }         // Wrong order
email()                               // Noun, not verb
```

## Interface Template

```typescript
/**
 * {Adapter} provider interface for {purpose}.
 * 
 * @example
 * const provider = create{Adapter}Provider(env)
 * await provider.{method}({ ... })
 */
export interface {Adapter}Provider {
  /**
   * {Method description}.
   * 
   * @param params - Parameters
   * @returns Result
   * @throws {Error}ValidationError if params invalid
   * @throws {Error}RateLimitError if rate limited
   * @throws {Error}ProviderError for other errors
   */
  {method}(params: {Method}Params): Promise<{Method}Result>
}

export interface {Method}Params {
  required: string          // Required field (no ?)
  optional?: string         // Optional field (with ?)
}

export interface {Method}Result {
  success: boolean
  error?: string
}
```

## Error Classes Template

```typescript
// Base error
export class {Adapter}ProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public cause?: Error
  ) {
    super(message)
    this.name = '{Adapter}ProviderError'
  }
}

// Validation error
export class {Adapter}ValidationError extends {Adapter}ProviderError {
  constructor(message: string, public field: string, provider: string) {
    super(message, 'VALIDATION_ERROR', provider)
    this.name = '{Adapter}ValidationError'
  }
}

// Rate limit error
export class {Adapter}RateLimitError extends {Adapter}ProviderError {
  constructor(message: string, provider: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider)
    this.name = '{Adapter}RateLimitError'
  }
}
```

## Production Implementation Template

```typescript
export class {Provider}{Adapter}Provider implements {Adapter}Provider {
  private client: {ProviderSDK}
  private config: Required<{Adapter}ProviderConfig>
  
  constructor(config: {Adapter}ProviderConfig) {
    // Validate required configuration
    if (!config.apiKey) {
      throw new Error('API key is required')
    }
    
    // Set defaults
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config
    }
    
    // Initialize client
    this.client = new {ProviderSDK}(this.config.apiKey)
  }
  
  async {method}(params: {Method}Params): Promise<{Method}Result> {
    // Validate parameters
    this.validate{Method}Params(params)
    
    try {
      // Call provider API
      const result = await this.client.{providerMethod}({ ... })
      
      return {
        success: true,
        ...result
      }
      
    } catch (err: any) {
      // Convert provider errors to standard errors
      throw this.handleError(err)
    }
  }
  
  private validate{Method}Params(params: {Method}Params): void {
    if (!params.required) {
      throw new {Adapter}ValidationError(
        'Required field is required',
        'required',
        '{provider}'
      )
    }
  }
  
  private handleError(err: any): Error {
    // Rate limit
    if (err.statusCode === 429) {
      return new {Adapter}RateLimitError(
        err.message,
        '{provider}',
        err.retryAfter
      )
    }
    
    // Authentication
    if (err.statusCode === 401 || err.statusCode === 403) {
      return new {Adapter}AuthenticationError(
        'Invalid credentials',
        '{provider}'
      )
    }
    
    // Generic error
    return new {Adapter}ProviderError(
      err.message,
      err.code || 'UNKNOWN_ERROR',
      '{provider}',
      err
    )
  }
}
```

## InMemory Implementation Template

```typescript
export class InMemory{Adapter}Provider implements {Adapter}Provider {
  private operations: Array<{
    type: string
    params: unknown
    timestamp: Date
  }> = []
  
  async {method}(params: {Method}Params): Promise<{Method}Result> {
    this.operations.push({
      type: '{method}',
      params,
      timestamp: new Date()
    })
    
    return {
      success: true,
      // ... result data
    }
  }
  
  // Test helpers
  getOperations() { return this.operations }
  getLastOperation() { return this.operations[this.operations.length - 1] }
  getOperationCount() { return this.operations.length }
  clear() { this.operations = [] }
}
```

## Mock Implementation Template

```typescript
export const createMock{Adapter}Provider = (): {Adapter}Provider => ({
  {method}: vi.fn().mockResolvedValue({
    success: true,
    // ... default result
  })
})
```

## Recording Implementation Template

```typescript
export class Recording{Adapter}Provider implements {Adapter}Provider {
  public calls: Array<{
    method: string
    args: unknown[]
    timestamp: Date
  }> = []
  
  async {method}(params: {Method}Params): Promise<{Method}Result> {
    this.calls.push({
      method: '{method}',
      args: [params],
      timestamp: new Date()
    })
    
    return {
      success: true,
      // ... result data
    }
  }
  
  // Test helpers
  getCalls() { return this.calls }
  getCallCount(method?: string) {
    return method
      ? this.calls.filter(c => c.method === method).length
      : this.calls.length
  }
  clear() { this.calls = [] }
}
```

## Stub Implementation Template

```typescript
export class Stub{Adapter}Provider implements {Adapter}Provider {
  constructor(private responses: Partial<{Method}Result> = {}) {}
  
  async {method}(_params: {Method}Params): Promise<{Method}Result> {
    return {
      success: true,
      // ... defaults
      ...this.responses
    }
  }
}

export const createFailing{Adapter}Provider = (error: string) => {
  return new Stub{Adapter}Provider({
    success: false,
    error
  })
}
```

## Factory Template

```typescript
export function create{Adapter}Provider(env: Env): {Adapter}Provider {
  const provider = env.{ADAPTER}_PROVIDER || '{default}'
  
  // Test providers (no config needed)
  switch (provider) {
    case 'mock':
      return createMock{Adapter}Provider()
    case 'inmemory':
      return new InMemory{Adapter}Provider()
    case 'recording':
      return new Recording{Adapter}Provider()
    case 'stub':
      return new Stub{Adapter}Provider()
  }
  
  // Production providers (require credentials)
  switch (provider) {
    case '{provider}':
      if (!env.{PROVIDER}_API_KEY) {
        throw new Error(
          '{PROVIDER}_API_KEY is required when {ADAPTER}_PROVIDER={provider}'
        )
      }
      return new {Provider}{Adapter}Provider({
        apiKey: env.{PROVIDER}_API_KEY,
        // ... other config
      })
      
    default:
      throw new Error(
        `Unknown {adapter} provider: ${provider}. ` +
        `Valid options: {provider1}, {provider2}, mock, inmemory`
      )
  }
}
```

## Container Integration

```typescript
// apps/workers/src/container.ts

export function createContainer(env: Env, tenantId: string) {
  // Create adapters
  const {adapter}Provider = create{Adapter}Provider(env)
  
  // Create services
  const services = {
    {service}: new {Service}Service(
      repositories.{repo},
      {adapter}Provider
    )
  }
  
  return {
    adapters: { {adapter}Provider },
    repositories,
    services
  }
}
```

## Test Structure

```typescript
describe('{Adapter}Provider', () => {
  describe('InMemory implementation', () => {
    let provider: InMemory{Adapter}Provider
    
    beforeEach(() => {
      provider = new InMemory{Adapter}Provider()
    })
    
    test('{method} records operation', async () => {
      const params = { /* ... */ }
      
      const result = await provider.{method}(params)
      
      expect(result.success).toBe(true)
      expect(provider.getOperationCount()).toBe(1)
      expect(provider.getLastOperation().params).toEqual(params)
    })
  })
  
  describe('Mock implementation', () => {
    test('allows call verification', async () => {
      const provider = createMock{Adapter}Provider()
      const params = { /* ... */ }
      
      await provider.{method}(params)
      
      expect(provider.{method}).toHaveBeenCalledWith(params)
      expect(provider.{method}).toHaveBeenCalledTimes(1)
    })
  })
  
  describe('Stub implementation', () => {
    test('can simulate failures', async () => {
      const provider = createFailing{Adapter}Provider('Error message')
      
      const result = await provider.{method}({ /* ... */ })
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Error message')
    })
  })
})
```

## Environment Variables

```bash
# .env.example

# {Adapter} provider selection
# Values: {provider1} | {provider2} | mock | inmemory | recording | stub
# Default: {provider1}
{ADAPTER}_PROVIDER={provider1}

# {Provider} configuration (required if {ADAPTER}_PROVIDER={provider})
{PROVIDER}_API_KEY=
{PROVIDER}_OTHER_CONFIG=
```

## Common Patterns

### Constructor Injection

```typescript
// ✅ CORRECT - Dependencies injected
export class {Service}Service {
  constructor(
    private {repo}: {Repo}Repository,
    private {adapter}: {Adapter}Provider
  ) {}
  
  async {method}(): Promise<void> {
    await this.{adapter}.{method}({ ... })
  }
}

// ❌ WRONG - Hidden dependencies
export class {Service}Service {
  async {method}(): Promise<void> {
    const adapter = get{Adapter}Provider() // Where did this come from?
  }
}
```

### Validation

```typescript
// Validate at interface boundary
async {method}(params: {Method}Params): Promise<{Method}Result> {
  // Validate first
  if (!params.required) {
    throw new {Adapter}ValidationError(
      'Required field is required',
      'required',
      '{provider}'
    )
  }
  
  // Then proceed
  // ...
}
```

### Error Conversion

```typescript
try {
  // Provider call
} catch (err: any) {
  // Convert to standard error
  if (err.statusCode === 429) {
    throw new {Adapter}RateLimitError(/* ... */)
  }
  throw new {Adapter}ProviderError(/* ... */)
}
```

## Decision Matrix

### Which Test Double?

| Test Type | Need Call Verification? | Need State Inspection? | Use This |
|-----------|-------------------------|------------------------|----------|
| Unit | Yes | No | Mock |
| Unit | No | No | Stub |
| Integration | No | Yes | InMemory |
| Integration | Yes | Yes | Recording |
| E2E | No | Yes | InMemory |

### When to Create New Adapter?

Create an adapter when:
- [ ] The service is external (not your code)
- [ ] Multiple providers exist or might in the future
- [ ] You need to test without the real service
- [ ] Cost optimization might require switching
- [ ] The service has rate limits or quotas

DON'T create an adapter when:
- [ ] It's your own internal service
- [ ] Only one provider exists and will exist
- [ ] The abstraction is trivial (1:1 mapping)
- [ ] Performance overhead matters (hot path)

## Checklist

### Before You Start
- [ ] Read ADR-005 for context
- [ ] Identify all methods needed
- [ ] Review provider's API documentation
- [ ] Check if similar adapter exists for reference

### Implementation Order
1. [ ] Define interface and types (`index.ts`)
2. [ ] Define error classes (`errors.ts`)
3. [ ] Implement InMemory version
4. [ ] Implement Mock version
5. [ ] Implement Recording version
6. [ ] Implement Stub version
7. [ ] Write tests for test implementations
8. [ ] Implement production version (e.g., Resend)
9. [ ] Create factory function
10. [ ] Add to container
11. [ ] Update `.env.example`
12. [ ] Write documentation

### Quality Checks
- [ ] All methods have JSDoc with examples
- [ ] All errors are documented with `@throws`
- [ ] All parameters use objects (not primitives)
- [ ] No shared mutable state
- [ ] Validation happens at boundary
- [ ] Provider errors converted to standard errors
- [ ] Factory validates configuration
- [ ] Tests cover happy path and errors
- [ ] Names follow conventions

## Resources

- [Complete Guide](./adapter-pattern-guide.md) - Full implementation guide with detailed examples
- [ADR-005](../../plans/decisions/ADR-005-adapter-architecture.md) - Architecture decision record
- [Testing Standards](../standards/testing.md) - Testing philosophy and practices
- [Code Standards](../standards/code-standards.md) - General coding standards
