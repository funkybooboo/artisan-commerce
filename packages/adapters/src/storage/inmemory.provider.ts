/**
 * In-memory storage provider for testing.
 * Stores files in memory as a Map.
 */

import type { StorageProvider } from './index.js'
import type {
  DeleteParams,
  DeleteResult,
  GetUrlParams,
  UploadParams,
  UploadResult,
} from './types.js'

interface StoredFile {
  content: Buffer | string
  contentType?: string
  metadata?: Record<string, string>
  uploadedAt: Date
}

export class InMemoryStorageProvider implements StorageProvider {
  private files = new Map<string, StoredFile>()

  async upload(params: UploadParams): Promise<UploadResult> {
    this.files.set(params.key, {
      content: params.content,
      contentType: params.contentType,
      metadata: params.metadata,
      uploadedAt: new Date(),
    })

    return {
      success: true,
      url: `inmemory://${params.key}`,
      key: params.key,
    }
  }

  async delete(params: DeleteParams): Promise<DeleteResult> {
    const existed = this.files.has(params.key)
    this.files.delete(params.key)

    return {
      success: existed,
      error: existed ? undefined : 'File not found',
    }
  }

  async getUrl(params: GetUrlParams): Promise<string> {
    return `inmemory://${params.key}`
  }

  // Test helper methods
  getFile(key: string): StoredFile | undefined {
    return this.files.get(key)
  }

  hasFile(key: string): boolean {
    return this.files.has(key)
  }

  clear(): void {
    this.files.clear()
  }

  getFileCount(): number {
    return this.files.size
  }

  getAllKeys(): string[] {
    return Array.from(this.files.keys())
  }
}
