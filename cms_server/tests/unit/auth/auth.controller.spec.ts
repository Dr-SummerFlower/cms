/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { CaptchaService } from '../../../src/auth/captcha.service';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../src/auth/dto/refresh-token.dto';
import { RegisterDto } from '../../../src/auth/dto/register.dto';
import { ValidationService } from '../../../src/auth/validation.service';
import { StoragesService } from '../../../src/storages/storages.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let validationService: ValidationService;
  let storagesService: StoragesService;
  let captchaService: CaptchaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validateCode: jest.fn(),
            clearCode: jest.fn(),
          },
        },
        {
          provide: StoragesService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: CaptchaService,
          useValue: {
            generate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    validationService = module.get<ValidationService>(ValidationService);
    storagesService = module.get<StoragesService>(StoragesService);
    captchaService = module.get<CaptchaService>(CaptchaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
      captchaId: '123e4567-e89b-12d3-a456-426614174000',
      captchaCode: 'A3bC',
    };

    const mockResponse = {
      access_token: 'access_token_mock',
      refresh_token: 'refresh_token_mock',
      user: {
        userId: '123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        avatar: 'http://example.com/avatar.png',
      },
    };

    it('应调用 authService.login 并返回结果', async () => {
      // Arrange
      jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123',
      code: '123456',
    };

    const avatarFile = {
      filename: 'avatar.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    const mockUploadUrl = 'http://example.com/avatar.png';
    const mockResponse = {
      access_token: 'access_token_mock',
      refresh_token: 'refresh_token_mock',
      user: {
        userId: '123',
        username: 'newuser',
        email: 'new@example.com',
        role: 'USER',
        avatar: mockUploadUrl,
      },
    };

    it('应验证验证码、上传头像、调用 authService.register 并清除验证码', async () => {
      // Arrange
      jest.spyOn(validationService, 'validateCode').mockResolvedValue();
      jest
        .spyOn(storagesService, 'uploadFile')
        .mockResolvedValue(mockUploadUrl);
      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);
      jest.spyOn(validationService, 'clearCode').mockResolvedValue();

      // Act
      const result = await controller.register(registerDto, avatarFile);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(validationService.validateCode).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.code,
        'register',
      );
      expect(storagesService.uploadFile).toHaveBeenCalledWith(
        avatarFile,
        'avatar',
      );
      expect(authService.register).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        password: registerDto.password,
        avatar: mockUploadUrl,
      });
      expect(validationService.clearCode).toHaveBeenCalledWith(
        registerDto.email,
        'register',
      );
    });

    it('当验证码验证失败时，不应继续注册流程', async () => {
      // Arrange
      jest
        .spyOn(validationService, 'validateCode')
        .mockRejectedValue(new Error('验证码错误'));

      // Act & Assert
      await expect(
        controller.register(registerDto, avatarFile),
      ).rejects.toThrow('验证码错误');
      expect(authService.register).not.toHaveBeenCalled();
      expect(storagesService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refresh_token: 'valid_refresh_token',
    };

    const mockResponse = {
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
    };

    it('应调用 authService.refreshToken 并返回结果', async () => {
      // Arrange
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);

      // Act
      const result = await controller.refresh(refreshTokenDto);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refresh_token,
      );
    });
  });

  describe('getCaptcha', () => {
    const mockCaptchaId = '123e4567-e89b-12d3-a456-426614174000';
    const mockImage = Buffer.from('png-image-data');

    it('应生成验证码并设置响应头', async () => {
      // Arrange
      jest.spyOn(captchaService, 'generate').mockResolvedValue({
        id: mockCaptchaId,
        image: mockImage,
      });

      const mockRes = {
        setHeader: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as Partial<Response>;

      // Act
      await controller.getCaptcha(mockRes as Response);

      // Assert
      expect(captchaService.generate).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Captcha-Id',
        mockCaptchaId,
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockImage);
    });
  });
});
