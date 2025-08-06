import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

interface ErrorResponse {
  code: number;
  message: string;
  data: unknown;
  timestamp: string;
  path: string;
}

@Catch(HttpException)
export class GlobalFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const request: Request = ctx.getRequest<Request>();
    const status: number = exception.getStatus();

    const exceptionResponse: string | object = exception.getResponse();

    let errorMessage: string;
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      errorMessage = (responseObj.message as string) || exception.message;
    } else {
      errorMessage = exceptionResponse;
    }

    const errorResponse: ErrorResponse = {
      code: status,
      message: errorMessage,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
