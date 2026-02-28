import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalInterceptor } from '../../../src/global/global.interceptor';

describe('GlobalInterceptor', () => {
  let interceptor: GlobalInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new GlobalInterceptor();
  });

  it('拦截器实例应被正确定义', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('应将成功响应转换为标准化格式', (done) => {
      // Arrange
      const mockData = { userId: 1, name: 'Test User' };
      const mockRequest = { url: '/api/test' } as Request;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn(),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockCallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      // Act
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      observable.subscribe({
        next: (result) => {
          expect(result).toEqual({
            code: 200,
            message: 'success',
            data: mockData,
            timestamp: expect.any(String),
            path: '/api/test',
          });
          done();
        },
      });

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('当遇到 HttpException 时，应保留原始错误', (done) => {
      // Arrange
      const testError = new HttpException('Test Error', HttpStatus.BAD_REQUEST);
      const mockRequest = { url: '/api/test' } as Request;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn(),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => testError)),
      };

      // Act
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      observable
        .pipe(
          catchError((error) => {
            expect(error).toBe(testError);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });

    it('应正确处理对象类型的响应错误', (done) => {
      // Arrange
      const errorResponse = {
        message: 'Validation Failed',
        statusCode: HttpStatus.BAD_REQUEST,
      };
      const testError = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = { url: '/api/test' } as Request;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn(),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => testError)),
      };

      // Act
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      observable
        .pipe(
          catchError((error) => {
            expect(error).toBe(testError);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });

    it('应正确处理包含数组消息的对象响应', (done) => {
      // Arrange
      const errorResponse = {
        message: ['First error', 'Second error'],
        statusCode: HttpStatus.BAD_REQUEST,
      };
      const testError = new HttpException(
        errorResponse,
        HttpStatus.BAD_REQUEST,
      );
      const mockRequest = { url: '/api/test' } as Request;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn(),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => testError)),
      };

      // Act
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      observable
        .pipe(
          catchError((error) => {
            expect(error).toBe(testError);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });

    it('应将非 HttpException 格式化为 HttpException', (done) => {
      // Arrange
      const genericError = new Error('Generic Error');
      const mockRequest = { url: '/api/test' } as Request;

      const mockExecutionContext: ExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn(),
        }),
        getClass: jest.fn(),
        getHandler: jest.fn(),
        getType: jest.fn().mockReturnValue('http'),
        getArgByIndex: jest.fn(),
        getArgs: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
      };

      const mockCallHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => genericError)),
      };

      // Act
      const observable = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      observable
        .pipe(
          catchError((error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(error.message).toBe('error');
            done();
            return of(null);
          }),
        )
        .subscribe();
    });
  });
});
