import { RedisToken } from '@nestjs-redis/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginLimitService } from '../../../src/auth/login-limit.service';

const REDIS_CLIENT = RedisToken();

const mockRedisService = {
  get: jest.fn(),
  del: jest.fn(),
  lPush: jest.fn(),
  expire: jest.fn(),
  lRange: jest.fn(),
  setEx: jest.fn(),
};

describe('LoginLimitService', () => {
  let service: LoginLimitService;
  let redisService: typeof mockRedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginLimitService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: unknown) => {
              const config: Record<string, unknown> = {
                LOGIN_LIMIT_SHORT_WINDOW_SECONDS: 30,
                LOGIN_LIMIT_SHORT_MAX_ATTEMPTS: 5,
                LOGIN_LIMIT_SHORT_LOCK_SECONDS: 60,
                LOGIN_LIMIT_LONG_WINDOW_SECONDS: 300,
                LOGIN_LIMIT_LONG_MAX_ATTEMPTS: 10,
                LOGIN_LIMIT_LONG_LOCK_SECONDS: 3600,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<LoginLimitService>(LoginLimitService);
    redisService = module.get(REDIS_CLIENT);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLimit', () => {
    const email = 'test@example.com';

    it('当没有锁定信息时，应不抛出异常', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      // Act & Assert
      await expect(service.checkLimit(email)).resolves.toBeUndefined();
    });

    it('当锁已过期时，应删除锁并不抛出异常', async () => {
      // Arrange
      const expiredLock = JSON.stringify({
        type: 'short',
        until: Date.now() - 1000,
      });
      jest.spyOn(redisService, 'get').mockResolvedValue(expiredLock);
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act & Assert
      await expect(service.checkLimit(email)).resolves.toBeUndefined();
      expect(redisService.del).toHaveBeenCalledWith(`login:lock:${email}`);
    });

    it('当锁未过期时，应抛出 HttpException', async () => {
      // Arrange
      const futureLock = JSON.stringify({
        type: 'short',
        until: Date.now() + 60000,
      });
      jest.spyOn(redisService, 'get').mockResolvedValue(futureLock);

      // Act & Assert
      await expect(service.checkLimit(email)).rejects.toThrow(HttpException);
      await expect(service.checkLimit(email)).rejects.toThrow(
        '登录尝试过于频繁，请在',
      );
      await expect(
        service.checkLimit(email).catch((e: HttpException) => e.getStatus()),
      ).resolves.toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('recordFailure', () => {
    const email = 'test@example.com';

    it('应记录登录失败并存储到 Redis', async () => {
      // Arrange
      jest.spyOn(redisService, 'lPush').mockResolvedValue(1);
      jest.spyOn(redisService, 'expire').mockResolvedValue(true);
      jest.spyOn(redisService, 'lRange').mockResolvedValue([]);

      // Act
      await service.recordFailure(email);

      // Assert
      expect(redisService.lPush).toHaveBeenCalledWith(
        `login:failure:short:${email}`,
        expect.any(String),
      );
      expect(redisService.lPush).toHaveBeenCalledWith(
        `login:failure:long:${email}`,
        expect.any(String),
      );
    });

    it('当短时间内失败次数达到限制时，应设置短期锁', async () => {
      // Arrange
      const now = Date.now();
      const recentTimestamps = Array(5).fill(now.toString());

      jest.spyOn(redisService, 'lPush').mockResolvedValue(1);
      jest.spyOn(redisService, 'expire').mockResolvedValue(true);
      jest.spyOn(redisService, 'lRange').mockResolvedValue(recentTimestamps);
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');

      // Act
      await service.recordFailure(email);

      // Assert
      expect(redisService.setEx).toHaveBeenCalledWith(
        `login:lock:${email}`,
        60,
        expect.any(String),
      );
    });

    it('当长时间内失败次数达到限制时，应设置长期锁', async () => {
      // Arrange
      const now = Date.now();
      const shortTimestamps = ['1', '2', '3'];
      const longTimestamps = Array(10).fill(now.toString());

      jest.spyOn(redisService, 'lPush').mockResolvedValue(1);
      jest.spyOn(redisService, 'expire').mockResolvedValue(true);
      jest
        .spyOn(redisService, 'lRange')
        .mockResolvedValueOnce(shortTimestamps)
        .mockResolvedValueOnce(longTimestamps);
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');

      // Act
      await service.recordFailure(email);

      // Assert
      expect(redisService.setEx).toHaveBeenCalledWith(
        `login:lock:${email}`,
        3600,
        expect.any(String),
      );
    });
  });

  describe('clearFailure', () => {
    const email = 'test@example.com';

    it('应清除所有登录失败记录', async () => {
      // Arrange
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      await service.clearFailure(email);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(
        `login:failure:short:${email}`,
      );
      expect(redisService.del).toHaveBeenCalledWith(
        `login:failure:long:${email}`,
      );
      expect(redisService.del).toHaveBeenCalledWith(`login:lock:${email}`);
    });
  });
});
