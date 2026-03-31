import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Response } from '../types/';

/**
 * 将成功响应包装为统一结构，并将响应数据中的存储路径转换为公开访问地址的全局拦截器。
 */
@Injectable()
export class GlobalInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly storageBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>(
      'MINIO_PUBLIC_HOST',
      'http://localhost:9000',
    );
    this.storageBaseUrl = raw.replace(/\/$/, '');
  }

  /**
   * 对控制器返回值进行统一格式化，并将响应数据中的存储路径转换为公开访问地址。
   *
   * @param context - 当前请求的执行上下文
   * @param next - 后续处理器
   * @returns 包装后的标准响应流
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request: Request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map(
        (data: T): Response<T> => ({
          code: 200,
          message: 'success',
          data: this.normalizeUrls(data),
          timestamp: new Date().toISOString(),
          path: String(request.url),
        }),
      ),
      catchError((err: unknown): Observable<never> => {
        const status: number =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const response: string | object =
          err instanceof HttpException ? err.getResponse() : 'error';

        let message: string;
        if (typeof response === 'string') {
          message = response;
        } else if (
          response &&
          typeof response === 'object' &&
          'message' in response
        ) {
          message = Array.isArray(response.message)
            ? response.message.join(', ')
            : String(response.message);
        } else {
          message = 'error';
        }

        return throwError((): never => {
          if (err instanceof HttpException) {
            throw err;
          }

          // 非 HttpException 统一转换为标准 HTTP 异常，交给全局过滤器继续处理。
          throw new HttpException(message, status);
        });
      }),
    );
  }

  /**
   * 递归遍历响应数据，将以 `/` 开头的字符串字段拼接为完整的公开访问地址。
   *
   * @param data - 待处理的响应数据
   * @returns 路径已转换的数据
   */
  private normalizeUrls(data: T): T {
    return this.normalizeValue(data) as T;
  }

  /**
   * 递归处理任意值：数组逐项递归，对象按字段递归，字符串执行路径转换，其他类型原样返回。
   *
   * @param value - 待处理的任意值
   * @returns 处理后的值
   */
  private normalizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeValue(item));
    }
    if (!value || typeof value !== 'object' || value instanceof Date) {
      return value;
    }

    const plain =
      typeof (value as Record<string, unknown>)['toJSON'] === 'function'
        ? (value as { toJSON(): unknown }).toJSON()
        : value;

    if (!plain || typeof plain !== 'object') {
      return plain;
    }

    const record = plain as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, itemValue]) => [
        key,
        typeof itemValue === 'string'
          ? this.toPublicUrl(itemValue)
          : this.normalizeValue(itemValue),
      ]),
    );
  }

  /**
   * 将以 `/` 开头的存储路径拼接为完整的公开访问地址，其他字符串原样返回。
   *
   * @param value - 待处理的字符串
   * @returns 公开访问地址或原字符串
   */
  private toPublicUrl(value: string): string {
    if (value.startsWith('/')) {
      return `${this.storageBaseUrl}${value}`;
    }
    return value;
  }
}
