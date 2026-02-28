/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/auth.service';
import { CaptchaService } from '../../../src/auth/captcha.service';
import { LoginLimitService } from '../../../src/auth/login-limit.service';
import { User } from '../../../src/users/entities/user.entity';
import { UsersService } from '../../../src/users/users.service';

type MockUser = Partial<User>;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let loginLimitService: LoginLimitService;
  let captchaService: CaptchaService;

  const mockUser: User = {
    _id: '66c1234567890abcdef0123',
    id: '66c1234567890abcdef0123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: 'USER',
    avatar: 'http://example.com/avatar.png',
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => defaultValue),
          },
        },
        {
          provide: LoginLimitService,
          useValue: {
            checkLimit: jest.fn(),
            recordFailure: jest.fn(),
            clearFailure: jest.fn(),
          },
        },
        {
          provide: CaptchaService,
          useValue: {
            validate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    loginLimitService = module.get<LoginLimitService>(LoginLimitService);
    captchaService = module.get<CaptchaService>(CaptchaService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
      captchaId: '123e4567-e89b-12d3-a456-426614174000',
      captchaCode: 'A3bC',
    };

    it('当验证码错误时，应抛出 BadRequestException', async () => {
      // Arrange
      jest.spyOn(captchaService, 'validate').mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        '验证码错误或已过期',
      );
      expect(captchaService.validate).toHaveBeenCalledWith(
        loginDto.captchaId,
        loginDto.captchaCode,
      );
    });

    it('当用户不存在时，应记录失败并抛出 BadRequestException', async () => {
      // Arrange
      jest.spyOn(captchaService, 'validate').mockResolvedValue(true);
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(null as unknown as User);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('用户名或密码错误');
      expect(loginLimitService.recordFailure).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it('当密码错误时，应记录失败并抛出 BadRequestException', async () => {
      // Arrange
      jest.spyOn(captchaService, 'validate').mockResolvedValue(true);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('用户名或密码错误');
      expect(loginLimitService.recordFailure).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it('当登录信息正确时，应返回 token 和用户信息', async () => {
      // Arrange
      jest.spyOn(captchaService, 'validate').mockResolvedValue(true);
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'access_token_mock',
        refresh_token: 'refresh_token_mock',
        user: {
          userId: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          avatar: mockUser.avatar,
        },
      });
      expect(loginLimitService.clearFailure).toHaveBeenCalledWith(
        loginDto.email,
      );
    });
  });

  describe('register', () => {
    const registerData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'Password123',
      avatar: 'http://example.com/new-avatar.png',
    };

    it('当邮箱已被注册时，应抛出 ConflictException', async () => {
      // Arrange
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerData)).rejects.toThrow(
        '该邮箱已被注册',
      );
    });

    it('当注册成功时，应返回 token 和用户信息', async () => {
      // Arrange
      const createdUser: MockUser = {
        ...mockUser,
        email: registerData.email,
        username: registerData.username,
      };
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(null as unknown as User);
      jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(createdUser as unknown as User);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access_token_mock')
        .mockResolvedValueOnce('refresh_token_mock');

      // Act
      const result = await service.register(registerData);

      // Assert
      expect(result).toEqual({
        access_token: 'access_token_mock',
        refresh_token: 'refresh_token_mock',
        user: {
          userId: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
          role: createdUser.role,
          avatar: createdUser.avatar,
        },
      });
      expect(usersService.create).toHaveBeenCalledWith({
        username: registerData.username,
        avatar: registerData.avatar,
        email: registerData.email,
        password: registerData.password,
      });
    });

    it('当注册过程中发生异常时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(null as unknown as User);
      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.register(registerData)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.register(registerData)).rejects.toThrow(
        '用户注册失败，请稍后重试',
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid_refresh_token';
    const decodedPayload = {
      sub: mockUser.id,
      username: mockUser.username,
    };

    it('当 refresh token 无效时，应抛出 UnauthorizedException', async () => {
      // Arrange
      jest
        .spyOn(service, 'validateRefreshToken')
        .mockRejectedValue(new UnauthorizedException('无效的 refresh token'));

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('当用户不存在时，应抛出 UnauthorizedException', async () => {
      // Arrange
      jest
        .spyOn(service, 'validateRefreshToken')
        .mockResolvedValue(decodedPayload);
      jest
        .spyOn(usersService, 'findOneById')
        .mockResolvedValue(null as unknown as User);

      // Act & Assert
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        '用户不存在或令牌无效',
      );
    });

    it('当 refresh token 有效且用户存在时，应返回新的 token 对', async () => {
      // Arrange
      jest
        .spyOn(service, 'validateRefreshToken')
        .mockResolvedValue(decodedPayload);
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      // Act
      const result = await service.refreshToken(refreshToken);

      // Assert
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
    });
  });

  describe('validateRefreshToken', () => {
    const refreshToken = 'valid_refresh_token';
    const decodedPayload = {
      sub: mockUser.id,
      username: mockUser.username,
      iat: 1234567890,
      exp: 1234567890,
    };

    it('当 token 有效时，应返回解析后的 payload', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('refresh_secret');
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(decodedPayload);

      // Act
      const result = await service.validateRefreshToken(refreshToken);

      // Assert
      expect(result).toEqual(decodedPayload);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh_secret',
      });
    });

    it('当 token 无效时，应抛出 UnauthorizedException', async () => {
      // Arrange
      jest.spyOn(configService, 'get').mockReturnValue('refresh_secret');
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(service.validateRefreshToken(refreshToken)).rejects.toThrow(
        '无效的refresh token',
      );
    });
  });
});
