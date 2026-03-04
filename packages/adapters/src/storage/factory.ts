/**
 * Factory function to create storage providers based on environment configuration.
 */

import type { StorageProvider } from './index.js'
import { InMemoryStorageProvider } from './inmemory.provider.js'

export interface StorageProviderEnv {
  STORAGE_PROVIDER?: string
  R2_ENDPOINT?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_BUCKET_NAME?: string
}

/**
 * Create a storage provider based on environment configuration.
 *
 * Supported providers:
 * - r2: Cloudflare R2 (production, not yet implemented)
 * - inmemory: In-memory provider for testing
 *
 * @param env - Environment configuration
 * @returns Configured storage provider
 * @throws Error if provider is unknown or configuration is invalid
 *
 * @example
 * // Testing
 * const storage = createStorageProvider({
 *   STORAGE_PROVIDER: 'inmemory'
 * })
 */
export function createStorageProvider(env: StorageProviderEnv): StorageProvider {
  const provider = env.STORAGE_PROVIDER || 'inmemory'

  switch (provider) {
    case 'r2':
      // R2 implementation will be added in later phases
      throw new Error('R2 storage provider not yet implemented')

    case 'inmemory':
      return new InMemoryStorageProvider()

    default:
      throw new Error(`Unknown storage provider: ${provider}`)
  }
}
