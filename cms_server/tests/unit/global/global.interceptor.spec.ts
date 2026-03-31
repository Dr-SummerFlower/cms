import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GlobalInterceptor } from '../../../src/global/global.interceptor';

function makeContext(url = '/api/test'): ExecutionContext {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ url } as Request),
      getResponse: jest.fn(),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getType: jest.fn().mockReturnValue('http'),
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as unknown as ExecutionContext;
}

function makeInterceptor(
  publicHost = 'http://cdn.example.com:9000',
) {
  return new GlobalInterceptor(
    new ConfigService({ MINIO_PUBLIC_HOST: publicHost }),
  );
}

describe('GlobalInterceptor', () => {
  it('拦截器实例应被正确定义', () => {
    expect(makeInterceptor('http://localhost:9000')).toBeDefined();
  });

  describe('图片 URL 归一化', () => {
    it('MinIO 直链：应将相对路径拼接为完整 MinIO 访问地址', (done) => {
      const interceptor = makeInterceptor('http://cdn.example.com:9000');
      const mockData = {
        avatar: '/assets/avatar/test.webp',
        concert: { poster: '/assets/poster/test.webp' },
        tickets: [{ faceImage: '/assets/face/test.webp' }],
      };

      interceptor
        .intercept(makeContext(), { handle: () => of(mockData) })
        .subscribe({
          next: (result) => {
            expect(result.data).toEqual({
              avatar: 'http://cdn.example.com:9000/assets/avatar/test.webp',
              concert: {
                poster: 'http://cdn.example.com:9000/assets/poster/test.webp',
              },
              tickets: [
                {
                  faceImage:
                    'http://cdn.example.com:9000/assets/face/test.webp',
                },
              ],
            });
            done();
          },
        });
    });

    it('Caddy HTTPS 代理：应将相对路径拼接为 HTTPS 访问地址', (done) => {
      const interceptor = makeInterceptor('https://cdn.example.com');
      const mockData = { avatar: '/assets/avatar/test.webp' };

      interceptor
        .intercept(makeContext(), { handle: () => of(mockData) })
        .subscribe({
          next: (result) => {
            expect((result.data as typeof mockData).avatar).toBe(
              'https://cdn.example.com/assets/avatar/test.webp',
            );
            done();
          },
        });
    });

    it('Caddy HTTP 代理：应将相对路径拼接为 HTTP 访问地址', (done) => {
      const interceptor = makeInterceptor('http://cdn.example.com');
      const mockData = { avatar: '/assets/avatar/test.webp' };

      interceptor
        .intercept(makeContext(), { handle: () => of(mockData) })
        .subscribe({
          next: (result) => {
            expect((result.data as typeof mockData).avatar).toBe(
              'http://cdn.example.com/assets/avatar/test.webp',
            );
            done();
          },
        });
    });

    it('末尾带斜杠的 base URL 不应产生双斜杠路径', (done) => {
      const interceptor = makeInterceptor('http://cdn.example.com:9000/');
      const mockData = { avatar: '/assets/avatar/test.webp' };

      interceptor
        .intercept(makeContext(), { handle: () => of(mockData) })
        .subscribe({
          next: (result) => {
            expect((result.data as typeof mockData).avatar).toBe(
              'http://cdn.example.com:9000/assets/avatar/test.webp',
            );
            done();
          },
        });
    });

    it('带有 toJSON 方法的对象（如 Mongoose Document）应先序列化再处理', (done) => {
      const interceptor = makeInterceptor('http://cdn.example.com:9000');
      const mockDoc = {
        toJSON: () => ({
          name: '测试演唱会',
          poster: '/assets/poster/test.webp',
        }),
      };

      interceptor
        .intercept(makeContext(), { handle: () => of({ concert: mockDoc }) })
        .subscribe({
          next: (result) => {
            expect(
              (result.data as { concert: { name: string; poster: string } })
                .concert,
            ).toEqual({
              name: '测试演唱会',
              poster: 'http://cdn.example.com:9000/assets/poster/test.webp',
            });
            done();
          },
        });
    });

    it('不以 / 开头的普通字符串不应被修改', (done) => {
      const interceptor = makeInterceptor();
      const mockData = { name: 'Test User', status: 'active', count: 42 };

      interceptor
        .intercept(makeContext(), { handle: () => of(mockData) })
        .subscribe({
          next: (result) => {
            expect(result.data).toEqual(mockData);
            done();
          },
        });
    });
  });

  describe('响应格式', () => {
    it('应将成功响应包装为标准结构', (done) => {
      const interceptor = makeInterceptor();
      const mockData = { id: 1 };

      interceptor
        .intercept(makeContext('/api/test'), { handle: () => of(mockData) })
        .subscribe({
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
    });
  });

  describe('异常处理', () => {
    it('应原样透传 HttpException', (done) => {
      const interceptor = makeInterceptor();
      const error = new HttpException('Test Error', HttpStatus.BAD_REQUEST);

      interceptor
        .intercept(makeContext(), {
          handle: () => throwError(() => error),
        })
        .pipe(
          catchError((e) => {
            expect(e).toBe(error);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });

    it('应将非 HttpException 包装为 500 异常', (done) => {
      const interceptor = makeInterceptor();

      interceptor
        .intercept(makeContext(), {
          handle: () => throwError(() => new Error('Generic Error')),
        })
        .pipe(
          catchError((e) => {
            expect(e).toBeInstanceOf(HttpException);
            expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });

    it('应正确处理包含数组 message 的 HttpException', (done) => {
      const interceptor = makeInterceptor();
      const error = new HttpException(
        { message: ['Error A', 'Error B'] },
        HttpStatus.BAD_REQUEST,
      );

      interceptor
        .intercept(makeContext(), {
          handle: () => throwError(() => error),
        })
        .pipe(
          catchError((e) => {
            expect(e).toBe(error);
            done();
            return of(null);
          }),
        )
        .subscribe();
    });
  });
});
