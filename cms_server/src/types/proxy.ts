import { Readable } from 'stream';

/**
 * Minio错误类型
 */
export interface MinioError extends Error {
  code?: string;
  message: string;
}

/**
 * 文件响应类型
 */
export interface FileResponse {
  stream: Readable;
  contentType: string;
  contentLength: number;
}
