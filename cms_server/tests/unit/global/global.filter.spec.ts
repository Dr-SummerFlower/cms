import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalFilter } from '../../../src/global/global.filter';

describe('GlobalFilter', () => {
  let filter: GlobalFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockContext: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/test-path',
    };

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  it('过滤器实例应被正确定义', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('当 HttpException 响应为对象时，应格式化错误响应', () => {
      // Arrange
      const exceptionResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Validation failed'],
        error: 'Bad Request',
      };

      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      // Act
      filter.catch(exception, mockContext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.BAD_REQUEST,
        message: ['Validation failed'],
        data: null,
        timestamp: expect.any(String),
        path: '/test-path',
      });
    });

    it('当 HttpException 响应为字符串时，应格式化错误响应', () => {
      // Arrange
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      // Act
      filter.catch(exception, mockContext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.NOT_FOUND,
        message: 'Not Found',
        data: null,
        timestamp: expect.any(String),
        path: '/test-path',
      });
    });

    it('应正确提取对象响应中的 message 属性', () => {
      // Arrange
      const exceptionResponse = {
        error: 'Some Error',
        message: 'Detailed error message',
        statusCode: HttpStatus.CONFLICT,
      };

      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.CONFLICT,
      );

      // Act
      filter.catch(exception, mockContext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.CONFLICT,
        message: 'Detailed error message',
        data: null,
        timestamp: expect.any(String),
        path: '/test-path',
      });
    });

    it('当响应对象没有 message 属性时，应使用异常消息', () => {
      // Arrange
      const errorMessage = 'Generic error';
      const exceptionResponse = {
        error: 'Some Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };

      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      Object.defineProperty(exception, 'message', {
        value: errorMessage,
        writable: false,
      });

      // Act
      filter.catch(exception, mockContext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errorMessage,
        data: null,
        timestamp: expect.any(String),
        path: '/test-path',
      });
    });

    it('当响应是字符串时，应直接使用该字符串', () => {
      // Arrange
      const stringResponse = 'String error message';
      const exception = new HttpException(
        stringResponse,
        HttpStatus.UNAUTHORIZED,
      );

      // Act
      filter.catch(exception, mockContext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        code: HttpStatus.UNAUTHORIZED,
        message: stringResponse,
        data: null,
        timestamp: expect.any(String),
        path: '/test-path',
      });
    });
  });
});
