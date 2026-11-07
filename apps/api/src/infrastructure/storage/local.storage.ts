import fs from 'node:fs';
import path from 'node:path';
import type { StorageProvider, UploadOptions } from './index.js';

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;
  private baseUrl: string;
  private isServerless: boolean;

  constructor(
    uploadDir = path.resolve(process.cwd(), 'uploads'),
    baseUrl = process.env.API_BASE_URL || 'http://localhost:5001'
  ) {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (!this.isServerless) {
      try {
        if (!fs.existsSync(this.uploadDir)) {
          fs.mkdirSync(this.uploadDir, { recursive: true });
        }
      } catch {
        this.isServerless = true;
      }
    }
  }

  async uploadFile(fileBuffer: Buffer, filePath: string, options?: UploadOptions): Promise<string> {
    const filename = options?.filename || path.basename(filePath);
    const contentType = options?.contentType || 'application/pdf';

    // In serverless or read-only execution, encode file buffer into a persistent Data URL
    if (this.isServerless) {
      return `data:${contentType};base64,${fileBuffer.toString('base64')}`;
    }

    try {
      const destPath = path.join(this.uploadDir, filename);
      await fs.promises.writeFile(destPath, fileBuffer);
      return `${this.baseUrl}/uploads/${filename}`;
    } catch {
      // Graceful fallback to Data URL if local disk is unwritable
      return `data:${contentType};base64,${fileBuffer.toString('base64')}`;
    }
  }

  async getFileUrl(filePath: string): Promise<string> {
    if (filePath.startsWith('data:') || filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const filename = path.basename(filePath);
    return `${this.baseUrl}/uploads/${filename}`;
  }
}

export const localStorageProvider = new LocalStorageProvider();

