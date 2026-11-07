/**
 * Storage Provider Abstraction Interface
 * Supports AWS S3 in production and local filesystem mock for testing
 */
export interface UploadOptions {
  contentType?: string;
  filename?: string;
}

export interface StorageProvider {
  /**
   * Uploads a file buffer or stream and returns a persistent public or signed URL
   */
  uploadFile(fileBuffer: Buffer, path: string, options?: UploadOptions): Promise<string>;

  /**
   * Retrieves a URL for an uploaded resource
   */
  getFileUrl(path: string): Promise<string>;
}

export * from './local.storage.js';

