import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';
import { ErrorResponse } from '../types';

/**
 * 将 HTTP 异常统一转换为前端约定的错误响应结构。
 */
@Catch(HttpException)
export class GlobalFilter implements ExceptionFilter {
  /**
   * 捕获请求处理过程中抛出的 HTTP 异常并格式化响应。
   *
   * @param exception - 当前捕获到的 HTTP 异常
   * @param host - Nest 参数宿主对象
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    // 获取HTTP上下文
    const ctx: HttpArgumentsHost = host.switchToHttp();
    // 获取响应对象
    const response: Response = ctx.getResponse<Response>();
    // 获取请求对象
    const request: Request = ctx.getRequest<Request>();
    // 获取HTTP状态码
    const status: number = exception.getStatus();

    // 获取异常响应内容
    const exceptionResponse: string | object = exception.getResponse();

    let errorMessage: string;
    // 判断异常响应是否为对象类型
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      // 将异常响应转换为记录类型
      const responseObj = exceptionResponse as Record<string, unknown>;
      // 优先复用异常对象中的 message，保证校验错误等信息不丢失。
      errorMessage = (responseObj.message as string) || exception.message;
    } else {
      // 直接使用字符串类型的异常响应
      errorMessage = exceptionResponse;
    }

    // 构造标准化的错误响应对象
    const errorResponse: ErrorResponse = {
      code: status,
      message: errorMessage,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 返回格式化的错误响应
    response.status(status).json(errorResponse);
  }
}
