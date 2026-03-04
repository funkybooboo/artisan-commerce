/**
 * File storage provider interface for uploading and managing files.
 *
 * All implementations must support:
 * - File uploads with metadata
 * - File deletion
 * - URL generation (public or signed)
 *
 * @example
 * const storage = new InMemoryStorageProvider()
 * const result = await storage.upload({
 *   key: 'projects/image.jpg',
 *   content: buffer,
 *   contentType: 'image/jpeg'
 * })
 */

import type {
  DeleteParams,
  DeleteResult,
  GetUrlParams,
  UploadParams,
  UploadResult,
} from './types.js'

export interface StorageProvider {
  /**
   * Upload a file to storage.
   *
   * @param params - Upload parameters
   * @returns Result with URL and key
   * @throws StorageProviderError if upload fails
   */
  upload(params: UploadParams): Promise<UploadResult>

  /**
   * Delete a file from storage.
   *
   * @param params - Delete parameters
   * @returns Result indicating success
   * @throws StorageProviderError if deletion fails
   */
  delete(params: DeleteParams): Promise<DeleteResult>

  /**
   * Get a URL for accessing a file.
   *
   * @param params - URL parameters
   * @returns Public or signed URL
   */
  getUrl(params: GetUrlParams): Promise<string>
}

// Re-export types
export * from './types.js'

// Export implementations
export { InMemoryStorageProvider } from './inmemory.provider.js'
export { createStorageProvider } from './factory.js'
