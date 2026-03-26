import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { FileResponse, MinioError } from '../types';

/**
 * 负责从对象存储读取文件并向代理层提供文件流的服务。
 */
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

  /**
   * 检查指定对象路径是否存在。
   *
   * @param objectPath - 请求中的对象路径
   * @returns 文件存在时不返回内容
   * @throws NotFoundException 当对象不存在或路径非法时抛出
   */
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
   * 从 MinIO 获取文件流与元信息。
   *
   * @param objectPath - 请求中的对象路径
   * @returns 包含文件流、类型和长度的响应对象
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

  /**
   * 将外部路径解析为 MinIO 对象名。
   *
   * @param objectPath - 可能包含桶名前缀的路径
   * @returns 去掉桶名前缀后的对象名
   * @throws NotFoundException 当路径为空或仅指向桶根路径时抛出
   */
  private resolveObjectName(objectPath: string): string {
    const normalized = objectPath.startsWith('/')
      ? objectPath.substring(1)
      : objectPath;

    // 禁止直接代理到桶根路径，避免将目录当作对象读取。
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

  /**
   * 将 MinIO 的不存在错误统一映射为业务侧的 404 异常。
   *
   * @param error - 底层 SDK 抛出的异常对象
   * @param objectPath - 当前访问的对象路径
   */
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
