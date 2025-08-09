import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Response } from '../types/';

/**
 * 全局响应拦截器
 * @class GlobalInterceptor
 * @implements {NestInterceptor<T, Response<T>>}
 * @template T - 响应数据类型
 * @description 拦截所有HTTP响应，统一格式化成功响应和错误处理
 */
@Injectable()
export class GlobalInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * 拦截请求和响应
   * @param {ExecutionContext} context - 执行上下文
   * @param {CallHandler} next - 调用处理器
   * @returns {Observable<Response<T>>} 格式化后的响应数据流
   * @description 拦截HTTP请求，格式化成功响应并处理异常
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // 获取请求对象
    const request: Request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      // 处理成功响应，统一格式化
      map(
        (data: T): Response<T> => ({
          code: 200,
          message: 'success',
          data,
          timestamp: new Date().toISOString(),
          path: String(request.url),
        }),
      ),
      // 捕获并处理异常
      catchError((err: any): Observable<never> => {
        // 确定HTTP状态码
        const status: number =
          err instanceof HttpException
            ? err.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // 获取异常响应内容
        const response: string | object =
          err instanceof HttpException ? err.getResponse() : 'error';

        let message: string;
        // 处理字符串类型的响应
        if (typeof response === 'string') {
          message = response;
        } else if (
          response &&
          typeof response === 'object' &&
          'message' in response
        ) {
          // 处理对象类型的响应，支持数组消息
          message = Array.isArray(response.message)
            ? response.message.join(', ')
            : String(response.message);
        } else {
          // 默认错误消息
          message = 'error';
        }

        // 抛出格式化的异常
        return throwError((): never => {
          if (err instanceof HttpException) {
            throw err;
          }
          throw new HttpException(message, status);
        });
      }),
    );
  }
}
