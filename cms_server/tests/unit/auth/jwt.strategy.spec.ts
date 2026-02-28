/* eslint-disable @typescript-eslint/unbound-method */
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';
import { User } from '../../../src/users/entities/user.entity';
import { UsersService } from '../../../src/users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: UsersService;

  const mockUser: User = {
    _id: '66c1234567890abcdef0123',
    id: '66c1234567890abcdef0123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
    avatar: 'http://example.com/avatar.png',
  } as User;

  const mockPayload = {
    sub: mockUser.id,
    username: mockUser.username,
    iat: 1234567890,
    exp: 1234567890,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('当用户存在时，应返回用户信息', async () => {
      // Arrange
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser);

      // Act
      const result = await (strategy as any).validate(mockPayload);

      // Assert
      expect(result).toEqual({
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        avatar: mockUser.avatar,
        role: mockUser.role,
      });
      expect(usersService.findOneById).toHaveBeenCalledWith(mockUser.id);
    });

    it('当用户不存在时，应抛出 UnauthorizedException', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'findOneById')
        .mockResolvedValue(null as unknown as User);

      // Act & Assert
      await expect((strategy as any).validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect((strategy as any).validate(mockPayload)).rejects.toThrow(
        '用户不存在或令牌无效',
      );
    });

    it('当查询用户抛出异常时，应抛出 UnauthorizedException', async () => {
      // Arrange
      jest
        .spyOn(usersService, 'findOneById')
        .mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect((strategy as any).validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect((strategy as any).validate(mockPayload)).rejects.toThrow(
        '用户不存在或令牌无效',
      );
    });
  });
});
