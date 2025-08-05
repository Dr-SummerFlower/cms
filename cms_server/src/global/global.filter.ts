import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

@Catch(HttpException)
export class GlobalFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    const status: number = exception.getStatus();

    response.status(status).json({
      code: status,
      message: 'error',
      data: {},
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
