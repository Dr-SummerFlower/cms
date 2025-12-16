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

  /**
   * 从minio获取文件流
   */
  async getFile(objectPath: string): Promise<FileResponse> {
    try {
      // 去掉前导斜杠（如果有）
      const normalizedPath = objectPath.startsWith('/')
        ? objectPath.substring(1)
        : objectPath;

      // 路径格式应该是：assets/avatar/... 或 assets/poster/...
      // minio的getObject需要的是bucket内的对象路径，不包含bucket名称
      let objectName: string;

      // 如果路径以bucket名称开头，去掉bucket前缀
      if (normalizedPath.startsWith(`${this.bucket}/`)) {
        // 去掉 bucket/ 前缀，例如：assets/poster/xxx.jpg -> poster/xxx.jpg
        objectName = normalizedPath.substring(this.bucket.length + 1);
      } else if (normalizedPath === this.bucket) {
        // 如果路径就是bucket名称，无效
        throw new NotFoundException(`无效的文件路径: ${objectPath}`);
      } else {
        // 如果没有bucket前缀，假设已经是对象名（例如：poster/xxx.jpg）
        objectName = normalizedPath;
      }

      // 验证objectName不为空
      if (!objectName || objectName.length === 0) {
        throw new NotFoundException(`无效的文件路径: ${objectPath}`);
      }

      // 从minio获取对象
      const stat = await this.client.statObject(this.bucket, objectName);
      const stream = await this.client.getObject(this.bucket, objectName);

      // 获取Content-Type，优先从元数据中获取
      const contentType: string =
        (stat.metaData?.['content-type'] as string | undefined) ||
        (stat.metaData?.['Content-Type'] as string | undefined) ||
        'application/octet-stream';

      return {
        stream,
        contentType,
        contentLength: stat.size,
      };
    } catch (error: unknown) {
      // 处理minio错误
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
      // 如果是NotFoundException，直接抛出
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
