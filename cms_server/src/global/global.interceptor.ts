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
 * 将成功响应包装为统一结构，并透传异常处理流程的全局拦截器。
 */
@Injectable()
export class GlobalInterceptor<T> implements NestInterceptor<T, Response<T>> {
  /**
   * 对控制器返回值进行统一格式化。
   *
   * @param context - 当前请求的执行上下文
   * @param next - 后续处理器
   * @returns 包装后的标准响应流
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
      catchError((err: unknown): Observable<never> => {
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

          // 非 HttpException 统一转换为标准 HTTP 异常，交给全局过滤器继续处理。
          throw new HttpException(message, status);
        });
      }),
    );
  }
}
