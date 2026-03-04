/**
 * File storage provider types for Artisan Commerce
 */

export interface UploadParams {
  key: string
  content: Buffer | string
  contentType?: string
  metadata?: Record<string, string>
}

export interface UploadResult {
  success: boolean
  url: string
  key: string
  error?: string
}

export interface DeleteParams {
  key: string
}

export interface DeleteResult {
  success: boolean
  error?: string
}

export interface GetUrlParams {
  key: string
  expiresIn?: number // seconds
}

export class StorageProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string
  ) {
    super(message)
    this.name = 'StorageProviderError'
  }
}
