import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { FileResponse, MinioError } from '../types';

@Injectable()
export class ProxyService {
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get<string>('MINIO_END_POINT', 'localhost');
    const port = Number(this.config.get<string>('MINIO_PORT', '9000'));
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY', '');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY', '');
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'assets');

    this.client = new MinioClient({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async statFile(objectPath: string): Promise<void> {
    const objectName = this.resolveObjectName(objectPath);
    await this.client
      .statObject(this.bucket, objectName)
      .catch((error: unknown) => {
        this.throwIfNotFound(error, objectPath);
        throw error;
      });
  }

  /**
   * 从minio获取文件流
   */
  async getFile(objectPath: string): Promise<FileResponse> {
    try {
      const objectName = this.resolveObjectName(objectPath);
      const stat = await this.client.statObject(this.bucket, objectName);
      const stream = await this.client.getObject(this.bucket, objectName);
      const contentType: string =
        (stat.metaData?.['content-type'] as string | undefined) ||
        (stat.metaData?.['Content-Type'] as string | undefined) ||
        'application/octet-stream';
      return { stream, contentType, contentLength: stat.size };
    } catch (error: unknown) {
      this.throwIfNotFound(error, objectPath);
      throw error;
    }
  }

  private resolveObjectName(objectPath: string): string {
    const normalized = objectPath.startsWith('/')
      ? objectPath.substring(1)
      : objectPath;
    if (normalized === this.bucket) {
      throw new NotFoundException(`无效的文件路径: ${objectPath}`);
    }
    const objectName = normalized.startsWith(`${this.bucket}/`)
      ? normalized.substring(this.bucket.length + 1)
      : normalized;
    if (!objectName) {
      throw new NotFoundException(`无效的文件路径: ${objectPath}`);
    }
    return objectName;
  }

  private throwIfNotFound(error: unknown, objectPath: string): void {
    if (error instanceof NotFoundException) throw error;
    if (error instanceof Error) {
      const minioError = error as MinioError;
      if (
        minioError.code === 'NotFound' ||
        minioError.message?.includes('does not exist') ||
        minioError.message?.includes('NoSuchKey')
      ) {
        throw new NotFoundException(`文件不存在: ${objectPath}`);
      }
    }
  }
}
