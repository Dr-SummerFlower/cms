import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Client as MinioClient } from 'minio';
import * as path from 'path';

@Injectable()
export class StoragesService {
  private readonly client: MinioClient;
  private readonly bucket: string;
  private readonly publicHost: string;
  private readonly useSSL: boolean;
  private readonly port: number;

  constructor(private readonly config: ConfigService) {
    const endPoint = this.config.get<string>('MINIO_END_POINT', 'localhost');
    const portStr = this.config.get<string>('MINIO_PORT', '9000');
    const useSSL = this.config.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY', '');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY', '');
    this.bucket = this.config.get<string>('MINIO_BUCKET', 'assets');
    this.publicHost = this.config.get<string>('MINIO_PUBLIC_HOST', 'localhost');
    this.useSSL = useSSL;
    this.port = Number(portStr);

    this.client = new MinioClient({
      endPoint,
      port: this.port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: 'avatar' | 'poster' | 'face',
  ): Promise<string> {
    if (!file || !file.buffer || !file.originalname) {
      throw new InternalServerErrorException('上传文件无效');
    }
    const ext = path.extname(file.originalname) || '';
    const objectName = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    return await this.putObjectAndGetUrl(
      objectName,
      file.buffer,
      file.buffer.length,
      file.mimetype,
    );
  }

  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: 'avatars' | 'posters',
  ): Promise<string> {
    if (buffer.length === 0) {
      throw new InternalServerErrorException('上传内容为空');
    }
    const ext = path.extname(filename) || '';
    const objectName = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    return await this.putObjectAndGetUrl(
      objectName,
      buffer,
      buffer.length,
      mimetype,
    );
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.client
      .bucketExists(this.bucket)
      .catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket, 'us-east-1');
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
  }

  private buildPublicUrl(objectName: string): string {
    const protocol = this.useSSL ? 'https' : 'http';
    return `${protocol}://${this.publicHost}:${this.port}/${this.bucket}/${objectName}`;
  }

  private async putObjectAndGetUrl(
    objectName: string,
    buffer: Buffer,
    length: number,
    contentType: string,
  ): Promise<string> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectName, buffer, length, {
      'Content-Type': contentType,
    });
    return this.buildPublicUrl(objectName);
  }
}
