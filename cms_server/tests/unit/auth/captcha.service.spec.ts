import { RedisToken } from '@nestjs-redis/client';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CaptchaService } from '../../../src/auth/captcha.service';

const REDIS_CLIENT = RedisToken();

const mockRedisService = {
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe('CaptchaService', () => {
  let service: CaptchaService;
  let redisService: typeof mockRedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptchaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: unknown) => {
              const config: Record<string, unknown> = {
                CAPTCHA_EXPIRE_SECONDS: 300,
                CAPTCHA_WIDTH: 150,
                CAPTCHA_HEIGHT: 47,
                CAPTCHA_SIZE: 4,
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

    service = module.get<CaptchaService>(CaptchaService);
    redisService = module.get(REDIS_CLIENT);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('应成功生成验证码图片和 ID', async () => {
      // Arrange
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');

      // Act
      const result = await service.generate();

      // Assert
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('image');
      expect(Buffer.isBuffer(result.image)).toBe(true);
      expect(result.id).toHaveLength(36);
      expect(redisService.setEx).toHaveBeenCalledWith(
        expect.stringMatching(/^captcha:/),
        300,
        expect.any(String),
      );
    });

    it('生成的验证码应为 4 位字母数字组合', async () => {
      // Arrange
      const storedCodes: string[] = [];
      jest
        .spyOn(redisService, 'setEx')
        .mockImplementation((_key, _duration, value) => {
          storedCodes.push(value as string);
          return Promise.resolve('OK');
        });

      // Act
      await service.generate();

      // Assert
      expect(storedCodes[0]).toHaveLength(4);
      expect(storedCodes[0]).toMatch(/^[0-9a-zA-Z]{4}$/);
    });

    it('当生成失败时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'setEx')
        .mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(service.generate()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.generate()).rejects.toThrow('生成验证码失败');
    });
  });

  describe('validate', () => {
    it('当验证码 ID 或代码为空时，应返回 false', async () => {
      // Act & Assert
      expect(await service.validate('', 'ABC123')).toBe(false);
      expect(await service.validate('test-id', '')).toBe(false);
      expect(await service.validate('', '')).toBe(false);
    });

    it('当验证码不存在时，应返回 false', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      // Act
      const result = await service.validate('test-id', 'ABC123');

      // Assert
      expect(result).toBe(false);
    });

    it('当验证码正确时，应返回 true 并删除验证码', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue('abc123');
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      const result = await service.validate('test-id', 'ABC123');

      // Assert
      expect(result).toBe(true);
      expect(redisService.get).toHaveBeenCalledWith('captcha:test-id');
      expect(redisService.del).toHaveBeenCalledWith('captcha:test-id');
    });

    it('当验证码不区分大小写匹配时，应返回 true', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue('abc');
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      const result = await service.validate('test-id', 'ABC');

      // Assert
      expect(result).toBe(true);
    });

    it('当验证码带空格时，应 trim 后比较', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValue('abc');
      jest.spyOn(redisService, 'del').mockResolvedValue(1);

      // Act
      const result = await service.validate('test-id', ' abc ');

      // Assert
      expect(result).toBe(true);
    });
  });
});
