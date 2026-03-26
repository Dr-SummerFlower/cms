import { Readable } from 'stream';

/**
 * MinIO SDK 抛出的错误结构。
 *
 * @category Model
 */
export interface MinioError extends Error {
  /** 错误码。 */
  code?: string;
  /** 错误消息。 */
  message: string;
}

/**
 * 代理层返回的文件流响应。
 *
 * @category Model
 */
export interface FileResponse {
  /** 文件可读流。 */
  stream: Readable;
  /** 响应内容类型。 */
  contentType: string;
  /** 响应内容长度。 */
  contentLength: number;
}
