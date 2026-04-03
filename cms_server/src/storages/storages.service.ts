import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Client as MinioClient } from 'minio';
import * as sharp from 'sharp';

/** 不同图片目录允许的最大宽度配置。 */
const IMAGE_MAX_WIDTH: Record<
  'avatar' | 'poster' | 'face' | 'avatars' | 'posters',
  number
> = {
  avatar: 400,
  avatars: 400,
  poster: 1200,
  posters: 1200,
  face: 600,
};

/**
 * 封装 MinIO 上传与图片压缩逻辑的对象存储服务。
 */
@Injectable()
export class StoragesService {
  private readonly logger = new Logger(StoragesService.name);
  private readonly client: MinioClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get<string>('MINIO_END_POINT', 'localhost');
    const portStr = this.config.get<string>('MINIO_PORT', '9000');
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY', '');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY', '');
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'assets');
    const port = Number(portStr);

    this.client = new MinioClient({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  /**
   * 上传 Multer 文件并返回数据库中保存的对象路径。
   *
   * @param file - 上传的原始文件对象
   * @param folder - 目标目录
   * @returns 以桶名开头的路径字符串
   * @throws InternalServerErrorException 当文件内容无效时抛出
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: 'avatar' | 'poster' | 'face',
  ): Promise<string> {
    try {
      if (!file || !file.buffer || !file.originalname) {
        throw new InternalServerErrorException('上传文件无效');
      }

      // 上传前统一压缩并转码，减少对象存储体积与带宽开销。
      const { buffer, mimetype } = await this.compressImage(
        file.buffer,
        file.mimetype,
        folder,
      );
      const objectName = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.webp`;
      return await this.putObjectAndGetPath(
        objectName,
        buffer,
        buffer.length,
        mimetype,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `上传文件到 ${folder} 目录时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('文件上传失败，请稍后重试');
    }
  }

  /**
   * 上传二进制缓冲区并返回数据库中保存的对象路径。
   *
   * @param buffer - 待上传的二进制内容
   * @param filename - 原始文件名
   * @param mimetype - 文件 MIME 类型
   * @param folder - 目标目录
   * @returns 以桶名开头的路径字符串
   * @throws InternalServerErrorException 当上传内容为空时抛出
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: 'avatars' | 'posters',
  ): Promise<string> {
    try {
      if (buffer.length === 0) {
        throw new InternalServerErrorException('上传内容为空');
      }
      const compressed = await this.compressImage(buffer, mimetype, folder);

      // 压缩后优先使用真实输出格式，保证文件扩展名与内容一致。
      const ext =
        compressed.mimetype === 'image/webp'
          ? '.webp'
          : `.${mimetype.split('/')[1] || 'bin'}`;
      const objectName = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
      return await this.putObjectAndGetPath(
        objectName,
        compressed.buffer,
        compressed.buffer.length,
        compressed.mimetype,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `上传 Buffer 到 ${folder} 目录时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('文件上传失败，请稍后重试');
    }
  }

  /**
   * 按目录规则压缩图片，并将可转换图片统一转为 WebP。
   *
   * @param buffer - 原始二进制内容
   * @param mimetype - 原始 MIME 类型
   * @param folder - 上传目录
   * @returns 压缩后的缓冲区与 MIME 类型
   */
  private async compressImage(
    buffer: Buffer,
    mimetype: string,
    folder: keyof typeof IMAGE_MAX_WIDTH,
  ): Promise<{ buffer: Buffer; mimetype: string }> {
    try {
      if (!mimetype.startsWith('image/') || mimetype === 'image/gif') {
        // GIF 动图和非图片文件保持原样，避免破坏内容结构。
        return { buffer, mimetype };
      }
      const maxWidth = IMAGE_MAX_WIDTH[folder];
      const converted = await sharp(buffer)
        .resize(maxWidth, undefined, { withoutEnlargement: true })
        .webp({ lossless: true })
        .toBuffer();
      return { buffer: converted, mimetype: 'image/webp' };
    } catch (error) {
      this.logger.error(
        `图片压缩处理失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('图片处理失败，请确认文件格式正确');
    }
  }

  /**
   * 确保存储桶存在，并在首次创建时写入公开读取策略。
   *
   * @returns 检查完成时不返回内容
   */
  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client
        .bucketExists(this.bucket)
        .catch(() => false);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');

        // 仅开放读取权限，上传仍然通过服务端凭证控制。
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['s3:GetBucketLocation', 's3:ListBucket'],
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Resource: [`arn:aws:s3:::${this.bucket}`],
            },
            {
              Action: ['s3:GetObject'],
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
      }
    } catch (error) {
      this.logger.error(
        `确认存储桶存在时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        '对象存储服务不可用，请检查 MinIO 连接配置',
      );
    }
  }

  /**
   * 构建用于数据库持久化的对象路径。
   *
   * @param objectName - 对象名称，例如 `avatar/2025-08-24/xxx.webp`
   * @returns 以桶名前缀开头的路径，例如 `/assets/avatar/2025-08-24/xxx.webp`
   */
  private buildPath(objectName: string): string {
    return `/${this.bucket}/${objectName}`;
  }

  /**
   * 上传对象并返回数据库中保存的路径。
   *
   * @param objectName - 目标对象名
   * @param buffer - 上传内容
   * @param length - 内容长度
   * @param contentType - 内容类型
   * @returns 以桶名前缀开头的路径字符串
   */
  private async putObjectAndGetPath(
    objectName: string,
    buffer: Buffer,
    length: number,
    contentType: string,
  ): Promise<string> {
    try {
      await this.ensureBucket();
      await this.client.putObject(this.bucket, objectName, buffer, length, {
        'Content-Type': contentType,
      });
      return this.buildPath(objectName);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `上传对象 ${objectName} 到 MinIO 时发生错误 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('文件存储失败，请稍后重试');
    }
  }
}
