/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { UpdateData, UserData } from '../../../src/types';
import { PaginationDto } from '../../../src/users/dto/pagination.dto';
import { User } from '../../../src/users/entities/user.entity';
import { UsersService } from '../../../src/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: Model<User>;

  // Mock 用户数据
  const mockUser = {
    _id: '66c123456789abcdeff04567',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$reallylonghashvaluehere',
    role: 'USER',
    avatar: '/assets/avatar/test.jpg',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  };

  // 创建用户数据
  const userData: UserData = {
    email: 'new@example.com',
    username: 'newuser',
    password: 'Password123',
    role: 'USER',
    avatar: '',
  } as any;

  const updateData: UpdateData = {
    username: 'updatedUser',
    email: 'newupdate@example.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'UserModel',
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
            findByIdAndDelete: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            save: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>('UserModel');
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应成功创建用户', async () => {
      // Arrange
      (userModel.create as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.create(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(userModel.create).toHaveBeenCalledWith(userData);
    });

    it('当数据验证失败时，应抛出 BadRequestException', async () => {
      // Arrange
      const validationError = new Error('ValidationError');
      validationError.name = 'ValidationError';
      (userModel.create as jest.Mock).mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当邮箱已被注册时，应抛出 ConflictException', async () => {
      // Arrange
      const duplicateError = {
        name: 'MongoError',
        code: 11000,
        message: 'Duplicate key error',
      };

      (userModel.create as jest.Mock).mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(ConflictException);
    });

    it('当发生意外错误时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      const internalError = new Error('Unexpected error');
      (userModel.create as jest.Mock).mockRejectedValue(internalError);

      // Act & Assert
      await expect(service.create(userData)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('应返回找到的用户', async () => {
      // Arrange
      const mockUserDoc = {
        _id: mockUser._id,
        username: mockUser.username,
        email: mockUser.email,
        password: mockUser.password,
        role: mockUser.role,
        avatar: mockUser.avatar,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      const mockQueryBuilder = {
        select: jest.fn().mockResolvedValue(mockUserDoc),
      };
      (userModel.findOne as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act
      const result = await service.findOne('test@example.com');

      // Assert
      expect(result).toEqual(mockUserDoc);
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('+password');
    });

    it('当邮箱格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(service.findOne('invalid-email')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当发生意外错误时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      const dbError = new Error('Database error');
      const mockQueryBuilder = {
        select: jest.fn().mockRejectedValue(dbError),
      };
      (userModel.findOne as jest.Mock).mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(service.findOne('test@example.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneById', () => {
    it('当 ID 有效且用户存在时，应返回用户', async () => {
      // Arrange
      const mockUserDoc = {
        _id: mockUser._id,
        username: mockUser.username,
        email: mockUser.email,
        password: mockUser.password,
        role: mockUser.role,
        avatar: mockUser.avatar,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };
      (userModel.findById as jest.Mock).mockResolvedValue(mockUserDoc);

      // Act
      const result = await service.findOneById('66c123456789abcdeff04567');

      // Assert
      expect(result).toEqual(mockUserDoc);
    });

    it('当 ID 格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(service.findOneById('invalidId')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当用户不存在时，应抛出 NotFoundException', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.findOneById('66c123456789abcdeff04567'),
      ).rejects.toThrow(NotFoundException);
    });

    it('当发生意外错误时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      const internalError = new Error('Database error');
      (userModel.findById as jest.Mock).mockRejectedValue(internalError);

      // Act & Assert
      await expect(
        service.findOneById('66c123456789abcdeff04567'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('应返回分页用户列表', async () => {
      // Arrange
      const mockPaginationDto: PaginationDto = { page: 1, limit: 10 };
      const mockUsers = [mockUser];
      const mockCount = 1;

      // Create a mock query builder pattern consistent with Mongoose
      const mockFindQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };
      const mockCountQueryBuilder = {
        exec: jest.fn().mockResolvedValue(mockCount),
      };

      (userModel.find as jest.Mock).mockReturnValue(mockFindQueryBuilder);
      (userModel.countDocuments as jest.Mock).mockReturnValue(
        mockCountQueryBuilder,
      );

      // Act
      const result = await service.findAll(mockPaginationDto);

      // Assert - check if it creates the expected DTO structure
      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('total');
      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(mockCount);
    });

    it('当分页参数无效时，应抛出 BadRequestException', async () => {
      // Arrange
      const invalidPagination: PaginationDto = { page: 0, limit: 0 };

      // Act & Assert
      await expect(service.findAll(invalidPagination)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('应支持搜索功能', async () => {
      // Arrange
      const mockPaginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };
      const mockUsers = [mockUser];
      const mockCount = 1;

      const mockFindQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      };
      const mockCountQueryBuilder = {
        exec: jest.fn().mockResolvedValue(mockCount),
      };

      (userModel.find as jest.Mock).mockReturnValue(mockFindQueryBuilder);
      (userModel.countDocuments as jest.Mock).mockReturnValue(
        mockCountQueryBuilder,
      );

      // Act
      const result = await service.findAll(mockPaginationDto);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('应成功更新用户', async () => {
      // Arrange
      const mockUserDoc = {
        _id: mockUser._id,
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$reallylonghashvaluehere',
        role: 'USER',
        avatar: '/assets/avatar/test.jpg',
        createdAt: new Date('2025-08-20T12:00:00.000Z'),
        updatedAt: new Date('2025-08-20T12:00:00.000Z'),
        save: jest.fn().mockResolvedValue(undefined),
      };

      const mockSelectQueryBuilder = {
        select: jest.fn().mockResolvedValue(mockUserDoc),
      };

      const mockFinalUser = {
        _id: mockUser._id,
        username: 'updatedUser',
        email: 'newupdate@example.com',
        password: mockUser.password,
        role: mockUser.role,
        avatar: mockUser.avatar,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      };

      // Mock for the final findById().exec() call
      const mockExecQueryBuilder = {
        exec: jest.fn().mockResolvedValue(mockFinalUser),
      };

      // First findById call (with select) returns the user doc
      // findOne call (for email check) returns null directly (no chaining)
      // Second findById call (after save) returns query builder with exec
      (userModel.findById as jest.Mock).mockReturnValueOnce(
        mockSelectQueryBuilder,
      );
      (userModel.findOne as jest.Mock).mockResolvedValue(null);
      (userModel.findById as jest.Mock).mockReturnValueOnce(
        mockExecQueryBuilder,
      );

      // Act
      const result = await service.update(
        '66c123456789abcdeff04567',
        updateData,
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe('updatedUser');
      expect(result.email).toBe('newupdate@example.com');
    });

    it('当 ID 格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(service.update('invalidId', updateData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当用户不存在时，应抛出 NotFoundException', async () => {
      // Arrange
      const mockSelectQueryBuilder = {
        select: jest.fn().mockResolvedValue(null),
      };
      (userModel.findById as jest.Mock).mockReturnValueOnce(
        mockSelectQueryBuilder,
      );

      // Act & Assert
      await expect(
        service.update('66c123456789abcdeff04567', updateData),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('应成功更新用户角色', async () => {
      // Arrange
      const mockUserToUpdate = { ...mockUser };

      (mockUserToUpdate as any).save = jest
        .fn()
        .mockResolvedValue(mockUserToUpdate);

      jest.spyOn(userModel, 'findById').mockResolvedValue(mockUserToUpdate);

      // Act
      const result = await service.updateRole(
        '66c123456789abcdeff04567',
        'ADMIN',
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.role).toBe('ADMIN');
    });

    it('当角色无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(
        service.updateRole('66c123456789abcdeff04567', 'INVALID_ROLE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当 ID 格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(service.updateRole('invalidId', 'ADMIN')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('应成功删除用户', async () => {
      // Arrange
      (userModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.remove('66c123456789abcdeff04567');

      // Assert
      expect(result).toBeNull();
    });

    it('当 ID 格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(service.remove('invalidId')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当用户不存在时，应抛出 NotFoundException', async () => {
      // Arrange
      (userModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('66c123456789abcdeff04567')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAvatar', () => {
    it('应成功更新用户头像', async () => {
      // Arrange
      const mockUserDoc = {
        _id: mockUser._id,
        username: 'testuser',
        email: 'test@example.com',
        password: mockUser.password,
        role: 'USER',
        avatar: '/old/avatar/path',
        createdAt: new Date('2025-08-20T12:00:00.000Z'),
        updatedAt: new Date('2025-08-20T12:00:00.000Z'),
        save: jest.fn().mockResolvedValue(undefined),
      };

      // findById returns user doc directly (not a query builder in this case)
      (userModel.findById as jest.Mock).mockResolvedValue(mockUserDoc);

      // Act
      const result = await service.updateAvatar(
        '66c123456789abcdeff04567',
        '/new/avatar/path',
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.avatar).toBe('/new/avatar/path');
    });

    it('当 ID 格式无效时，应抛出 BadRequestException', async () => {
      // Act & Assert
      await expect(
        service.updateAvatar('invalidId', '/new/avatar/path'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当用户不存在时，应抛出 NotFoundException', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateAvatar('66c123456789abcdeff04567', '/new/avatar/path'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
