import { RedisToken } from '@nestjs-redis/client';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from '../../../src/auth/validation.service';

const REDIS_CLIENT = RedisToken();

const mockRedisService = {
  get: jest.fn(),
  del: jest.fn(),
};

describe('ValidationService', () => {
  let service: ValidationService;
  let redisService: typeof mockRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    redisService = module.get(REDIS_CLIENT);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCode', () => {
    const email = 'test@example.com';
    const code = '123456';

    it('当邮箱格式无效时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act & Assert
      await expect(
        service.validateCode(invalidEmail, code, 'register'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateCode(invalidEmail, code, 'register'),
      ).rejects.toThrow('无效的邮箱格式');
    });

    it('当验证码不是 6 位数字时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidCode = '12345';

      // Act & Assert
      await expect(
        service.validateCode(email, invalidCode, 'register'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当验证码类型无效时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidType = 'invalid' as any;

      // Act & Assert
      await expect(
        service.validateCode(email, code, invalidType),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateCode(email, code, invalidType),
      ).rejects.toThrow('无效的验证码类型');
    });

    it('当验证码已过期或不存在时，应抛出 BadRequestException', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow('验证码已过期或不存在');
    });

    it('当验证码不匹配时，应抛出 BadRequestException', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue('654321');

      // Act & Assert
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow('验证码错误');
    });

    it('当验证码正确时，应不抛出异常', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(code);

      // Act & Assert
      await expect(
        service.validateCode(email, code, 'register'),
      ).resolves.toBeUndefined();
    });

    it('当验证码类型为 update 且正确时，应不抛出异常', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(code);

      // Act & Assert
      await expect(
        service.validateCode(email, code, 'update'),
      ).resolves.toBeUndefined();
    });

    it('当 Redis 发生错误时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'get')
        .mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.validateCode(email, code, 'register'),
      ).rejects.toThrow('验证码验证时发生错误');
    });
  });

  describe('clearCode', () => {
    const email = 'test@example.com';

    it('当邮箱格式无效时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidEmail = 'invalid-email';

      // Act & Assert
      await expect(service.clearCode(invalidEmail, 'register')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.clearCode(invalidEmail, 'register')).rejects.toThrow(
        '无效的邮箱格式',
      );
    });

    it('当验证码类型无效时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidType = 'invalid' as any;

      // Act & Assert
      await expect(service.clearCode(email, invalidType)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.clearCode(email, invalidType)).rejects.toThrow(
        '无效的验证码类型',
      );
    });

    it('当清除成功时，应调用 Redis del 方法', async () => {
      // Arrange
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      await service.clearCode(email, 'register');

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(`register:code:${email}`);
    });

    it('当清除 update 类型验证码时，应使用正确的 key', async () => {
      // Arrange
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      await service.clearCode(email, 'update');

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(`update:code:${email}`);
    });

    it('当 Redis 发生错误时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'del')
        .mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(service.clearCode(email, 'register')).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.clearCode(email, 'register')).rejects.toThrow(
        '清除验证码时发生错误',
      );
    });
  });
});
