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
 * 全局异常过滤器
 * @class GlobalFilter
 * @implements {ExceptionFilter}
 * @description 捕获并处理应用中的HTTP异常，统一返回错误响应格式
 */
@Catch(HttpException)
export class GlobalFilter implements ExceptionFilter {
  /**
   * 捕获异常并处理
   * @param {HttpException} exception - HTTP异常对象
   * @param {ArgumentsHost} host - 参数主机对象
   * @description 处理HTTP异常，格式化错误响应并返回给客户端
   */
  catch(exception: HttpException, host: ArgumentsHost) {
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
      // 提取错误消息，优先使用响应对象中的message
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
