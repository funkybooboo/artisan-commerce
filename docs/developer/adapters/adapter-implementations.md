# Adapter Implementations Reference

Concrete interface designs for all adapters. Use EmailProvider (in the [adapter-pattern-guide.md](./adapter-pattern-guide.md)) as the reference implementation.

## Table of Contents

1. [PaymentProvider](#paymentprovider)
2. [ShippingProvider](#shippingprovider)
3. [FileStorageProvider](#filestorageprovider)
4. [TaxCalculator](#taxcalculator)
5. [AuthProvider](#authprovider)
6. [TranslationProvider](#translationprovider)

---

## PaymentProvider

**Purpose:** Process payments, refunds, and handle payment webhooks

**Providers:** Stripe (default), Square, PayPal

### Interface Design

```typescript
export interface PaymentProvider {
  /**
   * Create a payment intent for a customer to complete.
   * 
   * @param params - Payment intent parameters
   * @returns Payment intent with client secret
   * @throws {PaymentValidationError} if params invalid
   * @throws {PaymentProviderError} for provider errors
   */
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntent>
  
  /**
   * Confirm a payment intent after customer authorization.
   * 
   * @param intentId - Payment intent ID
   * @returns Confirmed payment result
   * @throws {PaymentNotFoundError} if intent not found
   * @throws {PaymentProviderError} for provider errors
   */
  confirmPayment(intentId: string): Promise<PaymentResult>
  
  /**
   * Capture a previously authorized payment.
   * 
   * @param intentId - Payment intent ID
   * @param amount - Amount to capture (optional, defaults to full amount)
   * @returns Capture result
   * @throws {PaymentNotFoundError} if intent not found
   * @throws {PaymentProviderError} for provider errors
   */
  capturePayment(intentId: string, amount?: number): Promise<PaymentResult>
  
  /**
   * Refund a completed payment.
   * 
   * @param params - Refund parameters
   * @returns Refund result
   * @throws {PaymentNotFoundError} if payment not found
   * @throws {PaymentProviderError} for provider errors
   */
  refundPayment(params: RefundParams): Promise<RefundResult>
  
  /**
   * Get payment details by ID.
   * 
   * @param paymentId - Payment ID
   * @returns Payment details
   * @throws {PaymentNotFoundError} if payment not found
   */
  getPayment(paymentId: string): Promise<PaymentDetails>
  
  /**
   * Verify webhook signature and parse event.
   * 
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature header
   * @returns Parsed webhook event
   * @throws {PaymentWebhookError} if signature invalid
   */
  verifyWebhook(payload: string, signature: string): Promise<WebhookEvent>
}

export interface PaymentIntentParams {
  /** Amount in smallest currency unit (e.g., cents) */
  amount: number
  
  /** Currency code (ISO 4217) */
  currency: string
  
  /** Customer email */
  customerEmail: string
  
  /** Order ID for reference */
  orderId: string
  
  /** Payment method types to allow */
  paymentMethods?: string[]
  
  /** Whether to capture immediately or authorize only */
  captureMethod?: 'automatic' | 'manual'
  
  /** Metadata for tracking */
  metadata?: Record<string, string>
}

export interface PaymentIntent {
  /** Provider's intent ID */
  id: string
  
  /** Client secret for completing payment */
  clientSecret: string
  
  /** Current status */
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  
  /** Amount to be paid */
  amount: number
  
  /** Currency code */
  currency: string
}

export interface PaymentResult {
  /** Whether payment succeeded */
  success: boolean
  
  /** Provider's payment ID */
  paymentId: string
  
  /** Current status */
  status: string
  
  /** Amount paid/captured */
  amount: number
  
  /** Error message if failed */
  error?: string
}

export interface RefundParams {
  /** Payment ID to refund */
  paymentId: string
  
  /** Amount to refund (optional, defaults to full amount) */
  amount?: number
  
  /** Reason for refund */
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  
  /** Metadata for tracking */
  metadata?: Record<string, string>
}

export interface RefundResult {
  /** Whether refund succeeded */
  success: boolean
  
  /** Provider's refund ID */
  refundId: string
  
  /** Current status */
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  
  /** Amount refunded */
  amount: number
  
  /** Error message if failed */
  error?: string
}

export interface PaymentDetails {
  /** Provider's payment ID */
  id: string
  
  /** Current status */
  status: string
  
  /** Amount paid */
  amount: number
  
  /** Currency code */
  currency: string
  
  /** Customer email */
  customerEmail: string
  
  /** Payment method used */
  paymentMethod: {
    type: string
    last4?: string
    brand?: string
  }
  
  /** When payment was created */
  createdAt: Date
  
  /** Metadata */
  metadata: Record<string, string>
}

export interface WebhookEvent {
  /** Event type */
  type: string
  
  /** Event data */
  data: unknown
  
  /** When event occurred */
  timestamp: Date
}

export interface PaymentProviderConfig {
  apiKey: string
  webhookSecret?: string
  timeout?: number
  retries?: number
}
```

### Error Classes

```typescript
export class PaymentProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public cause?: Error
  ) {
    super(message)
    this.name = 'PaymentProviderError'
  }
}

export class PaymentValidationError extends PaymentProviderError {
  constructor(message: string, public field: string, provider: string) {
    super(message, 'VALIDATION_ERROR', provider)
    this.name = 'PaymentValidationError'
  }
}

export class PaymentNotFoundError extends PaymentProviderError {
  constructor(message: string, provider: string) {
    super(message, 'NOT_FOUND', provider)
    this.name = 'PaymentNotFoundError'
  }
}

export class PaymentDeclinedError extends PaymentProviderError {
  constructor(message: string, provider: string, public declineCode?: string) {
    super(message, 'PAYMENT_DECLINED', provider)
    this.name = 'PaymentDeclinedError'
  }
}

export class PaymentWebhookError extends PaymentProviderError {
  constructor(message: string, provider: string) {
    super(message, 'WEBHOOK_ERROR', provider)
    this.name = 'PaymentWebhookError'
  }
}
```

### Configuration

```bash
# .env.example

# Payment provider selection
PAYMENT_PROVIDER=stripe  # stripe | square | paypal | mock | inmemory

# Stripe configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ShippingProvider

**Purpose:** Generate shipping labels, calculate rates, track shipments

**Providers:** Shippo (default), EasyPost, USPS Direct

### Interface Design

```typescript
export interface ShippingProvider {
  /**
   * Calculate shipping rates for an order.
   * 
   * @param params - Shipment parameters
   * @returns Available shipping rates
   * @throws {ShippingValidationError} if params invalid
   * @throws {ShippingProviderError} for provider errors
   */
  getRates(params: ShipmentParams): Promise<ShippingRate[]>
  
  /**
   * Create a shipping label.
   * 
   * @param params - Label parameters
   * @returns Created label with tracking info
   * @throws {ShippingValidationError} if params invalid
   * @throws {ShippingProviderError} for provider errors
   */
  createLabel(params: LabelParams): Promise<ShippingLabel>
  
  /**
   * Get tracking information for a shipment.
   * 
   * @param trackingNumber - Tracking number
   * @returns Tracking details with status history
   * @throws {ShippingNotFoundError} if tracking not found
   * @throws {ShippingProviderError} for provider errors
   */
  getTracking(trackingNumber: string): Promise<TrackingInfo>
  
  /**
   * Cancel a shipping label and get refund.
   * 
   * @param labelId - Label ID to cancel
   * @returns Cancellation result
   * @throws {ShippingNotFoundError} if label not found
   * @throws {ShippingProviderError} for provider errors
   */
  cancelLabel(labelId: string): Promise<CancellationResult>
  
  /**
   * Validate an address.
   * 
   * @param address - Address to validate
   * @returns Validated address or validation errors
   */
  validateAddress(address: Address): Promise<AddressValidation>
}

export interface ShipmentParams {
  /** Sender address */
  from: Address
  
  /** Recipient address */
  to: Address
  
  /** Package dimensions and weight */
  parcel: Parcel
  
  /** Service levels to quote (optional, defaults to all) */
  serviceLevels?: string[]
}

export interface Address {
  /** Full name */
  name: string
  
  /** Company name (optional) */
  company?: string
  
  /** Street address line 1 */
  street1: string
  
  /** Street address line 2 (optional) */
  street2?: string
  
  /** City */
  city: string
  
  /** State/province code */
  state: string
  
  /** Postal/ZIP code */
  postalCode: string
  
  /** Country code (ISO 3166-1 alpha-2) */
  country: string
  
  /** Phone number (optional) */
  phone?: string
  
  /** Email (optional) */
  email?: string
}

export interface Parcel {
  /** Length in inches */
  length: number
  
  /** Width in inches */
  width: number
  
  /** Height in inches */
  height: number
  
  /** Weight in ounces */
  weight: number
}

export interface ShippingRate {
  /** Provider's rate ID */
  id: string
  
  /** Carrier name (USPS, FedEx, UPS, etc.) */
  carrier: string
  
  /** Service level (Priority, Ground, Overnight, etc.) */
  serviceLevel: string
  
  /** Cost in cents */
  cost: number
  
  /** Currency code */
  currency: string
  
  /** Estimated delivery days */
  estimatedDays: number
  
  /** Estimated delivery date */
  estimatedDate?: Date
}

export interface LabelParams {
  /** Rate ID to purchase */
  rateId: string
  
  /** Order ID for reference */
  orderId: string
}

export interface ShippingLabel {
  /** Provider's label ID */
  id: string
  
  /** Tracking number */
  trackingNumber: string
  
  /** Label URL (PDF) */
  labelUrl: string
  
  /** Carrier name */
  carrier: string
  
  /** Service level */
  serviceLevel: string
  
  /** Cost in cents */
  cost: number
  
  /** Current status */
  status: string
}

export interface TrackingInfo {
  /** Tracking number */
  trackingNumber: string
  
  /** Carrier name */
  carrier: string
  
  /** Current status */
  status: 'pre_transit' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'failure'
  
  /** Estimated delivery date */
  estimatedDelivery?: Date
  
  /** Tracking history */
  events: TrackingEvent[]
}

export interface TrackingEvent {
  /** Event status */
  status: string
  
  /** Event description */
  message: string
  
  /** Event location */
  location?: string
  
  /** Event timestamp */
  timestamp: Date
}

export interface CancellationResult {
  /** Whether cancellation succeeded */
  success: boolean
  
  /** Refund status */
  refund: {
    /** Whether refund was issued */
    granted: boolean
    
    /** Refund amount in cents */
    amount?: number
  }
  
  /** Error message if failed */
  error?: string
}

export interface AddressValidation {
  /** Whether address is valid */
  valid: boolean
  
  /** Normalized address (if valid) */
  normalized?: Address
  
  /** Validation errors */
  errors?: string[]
}

export interface ShippingProviderConfig {
  apiKey: string
  timeout?: number
  retries?: number
}
```

### Configuration

```bash
# .env.example

# Shipping provider selection
SHIPPING_PROVIDER=shippo  # shippo | easypost | usps | mock | inmemory

# Shippo configuration
SHIPPO_API_KEY=shippo_test_...
```

---

## FileStorageProvider

**Purpose:** Upload, download, and manage files in object storage

**Providers:** Cloudflare R2 (default), AWS S3, Google Cloud Storage, Local filesystem

### Interface Design

```typescript
export interface FileStorageProvider {
  /**
   * Upload a file.
   * 
   * @param params - Upload parameters
   * @returns Upload result with URL
   * @throws {StorageValidationError} if params invalid
   * @throws {StorageProviderError} for provider errors
   */
  upload(params: UploadParams): Promise<UploadResult>
  
  /**
   * Download a file.
   * 
   * @param key - File key/path
   * @returns File contents
   * @throws {StorageNotFoundError} if file not found
   * @throws {StorageProviderError} for provider errors
   */
  download(key: string): Promise<DownloadResult>
  
  /**
   * Delete a file.
   * 
   * @param key - File key/path
   * @returns Deletion result
   * @throws {StorageNotFoundError} if file not found
   * @throws {StorageProviderError} for provider errors
   */
  delete(key: string): Promise<DeleteResult>
  
  /**
   * Check if a file exists.
   * 
   * @param key - File key/path
   * @returns Whether file exists
   */
  exists(key: string): Promise<boolean>
  
  /**
   * Get file metadata.
   * 
   * @param key - File key/path
   * @returns File metadata
   * @throws {StorageNotFoundError} if file not found
   */
  getMetadata(key: string): Promise<FileMetadata>
  
  /**
   * Generate a presigned URL for direct upload.
   * 
   * @param params - Presigned URL parameters
   * @returns Presigned URL and fields
   * @throws {StorageProviderError} for provider errors
   */
  getPresignedUploadUrl(params: PresignedUploadParams): Promise<PresignedUrl>
  
  /**
   * Generate a presigned URL for direct download.
   * 
   * @param key - File key/path
   * @param expiresIn - URL expiration in seconds
   * @returns Presigned download URL
   * @throws {StorageNotFoundError} if file not found
   */
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>
  
  /**
   * List files with optional prefix filter.
   * 
   * @param params - List parameters
   * @returns List of file keys
   */
  list(params?: ListParams): Promise<FileList>
}

export interface UploadParams {
  /** File key/path */
  key: string
  
  /** File contents */
  content: Buffer | ReadableStream
  
  /** Content type */
  contentType: string
  
  /** Content length in bytes */
  contentLength: number
  
  /** Whether file is public */
  public?: boolean
  
  /** Metadata */
  metadata?: Record<string, string>
}

export interface UploadResult {
  /** File key */
  key: string
  
  /** Public URL (if public) */
  url?: string
  
  /** File size in bytes */
  size: number
  
  /** Content type */
  contentType: string
  
  /** ETag */
  etag: string
}

export interface DownloadResult {
  /** File contents */
  content: Buffer | ReadableStream
  
  /** Content type */
  contentType: string
  
  /** Content length */
  contentLength: number
  
  /** ETag */
  etag: string
  
  /** Last modified date */
  lastModified: Date
  
  /** Metadata */
  metadata?: Record<string, string>
}

export interface DeleteResult {
  /** Whether deletion succeeded */
  success: boolean
  
  /** Error message if failed */
  error?: string
}

export interface FileMetadata {
  /** File key */
  key: string
  
  /** File size in bytes */
  size: number
  
  /** Content type */
  contentType: string
  
  /** ETag */
  etag: string
  
  /** Last modified date */
  lastModified: Date
  
  /** Custom metadata */
  metadata?: Record<string, string>
}

export interface PresignedUploadParams {
  /** File key/path */
  key: string
  
  /** Content type */
  contentType: string
  
  /** Maximum file size in bytes */
  maxSize?: number
  
  /** URL expiration in seconds */
  expiresIn?: number
}

export interface PresignedUrl {
  /** Upload URL */
  url: string
  
  /** Form fields for POST upload */
  fields?: Record<string, string>
  
  /** Expiration timestamp */
  expiresAt: Date
}

export interface ListParams {
  /** Key prefix filter */
  prefix?: string
  
  /** Maximum results */
  limit?: number
  
  /** Pagination token */
  continuationToken?: string
}

export interface FileList {
  /** List of files */
  files: Array<{
    key: string
    size: number
    lastModified: Date
  }>
  
  /** Continuation token for next page */
  continuationToken?: string
  
  /** Whether more results exist */
  hasMore: boolean
}

export interface FileStorageProviderConfig {
  endpoint?: string
  accessKeyId?: string
  secretAccessKey?: string
  bucket: string
  region?: string
  publicUrl?: string
}
```

### Configuration

```bash
# .env.example

# File storage provider selection
STORAGE_PROVIDER=r2  # r2 | s3 | gcs | local | inmemory

# Cloudflare R2 configuration
R2_ENDPOINT=https://....r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=artisan-commerce-files
R2_PUBLIC_URL=https://files.example.com
```

---

## TaxCalculator

**Purpose:** Calculate sales tax for orders based on location and products

**Providers:** Stripe Tax (default), TaxJar, Avalara, Manual

### Interface Design

```typescript
export interface TaxCalculator {
  /**
   * Calculate tax for an order.
   * 
   * @param params - Tax calculation parameters
   * @returns Tax calculation result
   * @throws {TaxValidationError} if params invalid
   * @throws {TaxProviderError} for provider errors
   */
  calculateTax(params: TaxCalculationParams): Promise<TaxCalculation>
  
  /**
   * Validate a tax ID (VAT, GST, etc.).
   * 
   * @param taxId - Tax ID to validate
   * @param country - Country code
   * @returns Validation result
   */
  validateTaxId(taxId: string, country: string): Promise<TaxIdValidation>
  
  /**
   * Get tax rates for a location.
   * 
   * @param location - Location details
   * @returns Tax rates
   */
  getTaxRates(location: TaxLocation): Promise<TaxRates>
}

export interface TaxCalculationParams {
  /** Order ID for reference */
  orderId: string
  
  /** Customer location */
  customerAddress: {
    street1: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  /** Shipping address (if different from customer) */
  shippingAddress?: {
    street1: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  
  /** Line items */
  items: Array<{
    /** Item ID */
    id: string
    
    /** Amount in cents */
    amount: number
    
    /** Tax code (optional) */
    taxCode?: string
    
    /** Whether item is taxable */
    taxable?: boolean
  }>
  
  /** Shipping cost in cents */
  shippingCost?: number
  
  /** Customer tax ID (VAT, GST, etc.) */
  customerTaxId?: string
}

export interface TaxCalculation {
  /** Total tax amount in cents */
  totalTax: number
  
  /** Tax breakdown by jurisdiction */
  breakdown: Array<{
    /** Jurisdiction name (e.g., "California", "Los Angeles") */
    name: string
    
    /** Tax rate as decimal (e.g., 0.0725 for 7.25%) */
    rate: number
    
    /** Tax amount in cents */
    amount: number
    
    /** Tax type (e.g., "state", "county", "city") */
    type: string
  }>
  
  /** Tax on shipping */
  shippingTax?: number
  
  /** Whether customer is tax exempt */
  taxExempt: boolean
  
  /** Tax ID validation result (if provided) */
  taxIdValidation?: {
    valid: boolean
    name?: string
  }
}

export interface TaxIdValidation {
  /** Whether tax ID is valid */
  valid: boolean
  
  /** Business name (if valid) */
  name?: string
  
  /** Address (if valid) */
  address?: string
  
  /** Validation errors */
  errors?: string[]
}

export interface TaxLocation {
  street1?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface TaxRates {
  /** Combined tax rate */
  combinedRate: number
  
  /** Rate breakdown */
  breakdown: Array<{
    name: string
    rate: number
    type: string
  }>
}

export interface TaxCalculatorConfig {
  apiKey?: string
  mode?: 'test' | 'live'
  timeout?: number
}
```

### Configuration

```bash
# .env.example

# Tax calculator selection
TAX_PROVIDER=stripe-tax  # stripe-tax | taxjar | avalara | manual | mock

# TaxJar configuration (if TAX_PROVIDER=taxjar)
TAXJAR_API_KEY=...
```

---

## AuthProvider

**Purpose:** Authenticate users and manage sessions

**Providers:** Custom JWT (default), Auth0, Supabase Auth

### Interface Design

```typescript
export interface AuthProvider {
  /**
   * Generate an access token for a user.
   * 
   * @param userId - User ID
   * @param metadata - Additional claims
   * @returns Access token
   */
  generateToken(userId: string, metadata?: Record<string, unknown>): Promise<string>
  
  /**
   * Verify and decode an access token.
   * 
   * @param token - Access token
   * @returns Decoded token payload
   * @throws {AuthTokenError} if token invalid or expired
   */
  verifyToken(token: string): Promise<TokenPayload>
  
  /**
   * Refresh an access token.
   * 
   * @param refreshToken - Refresh token
   * @returns New access token
   * @throws {AuthTokenError} if refresh token invalid
   */
  refreshToken(refreshToken: string): Promise<string>
  
  /**
   * Revoke a token.
   * 
   * @param token - Token to revoke
   * @returns Whether revocation succeeded
   */
  revokeToken(token: string): Promise<boolean>
  
  /**
   * Hash a password.
   * 
   * @param password - Plain text password
   * @returns Hashed password
   */
  hashPassword(password: string): Promise<string>
  
  /**
   * Verify a password against a hash.
   * 
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns Whether password matches
   */
  verifyPassword(password: string, hash: string): Promise<boolean>
}

export interface TokenPayload {
  /** User ID */
  userId: string
  
  /** Token expiration timestamp */
  exp: number
  
  /** Token issued at timestamp */
  iat: number
  
  /** Additional claims */
  [key: string]: unknown
}

export interface AuthProviderConfig {
  jwtSecret?: string
  jwtExpiresIn?: string
  refreshSecret?: string
  refreshExpiresIn?: string
}
```

### Configuration

```bash
# .env.example

# Auth provider selection
AUTH_PROVIDER=jwt  # jwt | auth0 | supabase | mock

# JWT configuration
JWT_SECRET=...
JWT_EXPIRES_IN=1h
REFRESH_SECRET=...
REFRESH_EXPIRES_IN=7d
```

---

## TranslationProvider

**Purpose:** Manage translations and localization

**Providers:** JSON files (default), Lokalise, Phrase, Crowdin

### Interface Design

```typescript
export interface TranslationProvider {
  /**
   * Get a translated string.
   * 
   * @param key - Translation key
   * @param locale - Locale code
   * @param variables - Variables to substitute
   * @returns Translated string
   */
  translate(key: string, locale: string, variables?: Record<string, unknown>): Promise<string>
  
  /**
   * Get all translations for a locale.
   * 
   * @param locale - Locale code
   * @returns All translations
   */
  getTranslations(locale: string): Promise<Record<string, string>>
  
  /**
   * Get available locales.
   * 
   * @returns List of locale codes
   */
  getAvailableLocales(): Promise<string[]>
  
  /**
   * Sync translations from remote source.
   * 
   * @returns Number of translations synced
   */
  sync(): Promise<number>
}

export interface TranslationProviderConfig {
  apiKey?: string
  projectId?: string
  defaultLocale?: string
  fallbackLocale?: string
}
```

### Configuration

```bash
# .env.example

# Translation provider selection
TRANSLATION_PROVIDER=json  # json | lokalise | phrase | crowdin | mock

# Default and fallback locales
DEFAULT_LOCALE=en
FALLBACK_LOCALE=en

# Lokalise configuration (if TRANSLATION_PROVIDER=lokalise)
LOKALISE_API_KEY=...
LOKALISE_PROJECT_ID=...
```

---

## Summary

Each adapter follows the same pattern:

1. **Interface** - Defines methods the application needs
2. **Error Classes** - Custom errors for specific failure modes
3. **Four Test Implementations** - Mock, InMemory, Recording, Stub
4. **Production Implementations** - One per provider (Stripe, Resend, etc.)
5. **Factory Function** - Creates provider based on environment
6. **Configuration** - Environment variables for each provider

See [adapter-pattern-guide.md](./adapter-pattern-guide.md) for the complete EmailProvider implementation that serves as the template for all adapters.

## Implementation Priority

Based on v0.1.0 roadmap:

1. ✅ **EmailProvider** (reference implementation - see guide)
2. **PaymentProvider** (critical for MVP)
3. **ShippingProvider** (critical for MVP)
4. **FileStorageProvider** (needed for pattern PDFs)
5. **TaxCalculator** (can use manual calculation initially)
6. **AuthProvider** (needed for user accounts)
7. **TranslationProvider** (can defer to v0.2.0)
