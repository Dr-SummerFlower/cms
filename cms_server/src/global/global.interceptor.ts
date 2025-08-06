import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, map, Observable, throwError } from 'rxjs';

export interface Response<T> {
  code: number;
  message: string;
  data: T | null;
}

@Injectable()
export class GlobalInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map(
        (data: T): Response<T> => ({
          code: 200,
          message: 'success',
          data,
        }),
      ),
      catchError((err: any): Observable<never> => {
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
          throw new HttpException(message, status);
        });
      }),
    );
  }
}
