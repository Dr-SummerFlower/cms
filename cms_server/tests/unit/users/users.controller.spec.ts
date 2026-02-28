/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { ValidationService } from '../../../src/auth/validation.service';
import { StoragesService } from '../../../src/storages/storages.service';
import { PaginationDto } from '../../../src/users/dto/pagination.dto';
import { UpdateRoleDto } from '../../../src/users/dto/update-role.dto';
import { UpdateUserDto } from '../../../src/users/dto/update-user.dto';
import { User } from '../../../src/users/entities/user.entity';
import { UsersController } from '../../../src/users/users.controller';
import { UsersService } from '../../../src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;
  let validationService: ValidationService;
  let storagesService: StoragesService;

  const mockUser: Partial<User> = {
    _id: '66c1234567890abcdef0123',
    username: 'testuser',
    email: 'test@example.com',
    password: '$2b$10$reallylonghashvaluehere',
    role: 'USER',
    avatar: '/assets/avatar/test.jpg',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            updateRole: jest.fn(),
            remove: jest.fn(),
            updateAvatar: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    validationService = module.get<ValidationService>(ValidationService);
    storagesService = module.get<StoragesService>(StoragesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      const mockPaginatedResult = {
        users: [mockUser as User],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      jest
        .spyOn(usersService, 'findAll')
        .mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(paginationDto);

      expect(result).toEqual(mockPaginatedResult);
      expect(usersService.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      const userId = '66c1234567890abcdef0123';
      const fullMockUser = {
        _id: '66c1234567890abcdef0123',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$reallylonghashvaluehere',
        role: 'USER',
        avatar: '/assets/avatar/test.jpg',
        createdAt: new Date('2025-08-20T12:00:00.000Z'),
        updatedAt: new Date('2025-08-20T12:00:00.000Z'),
      } as User;

      jest.spyOn(usersService, 'findOneById').mockResolvedValue(fullMockUser);

      const result = await controller.findOne(userId);

      expect(result).toEqual(fullMockUser);
      expect(usersService.findOneById).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    const updateId = '66c1234567890abcdef0123';
    const otherUserId = '66c1234567890abcdef0124';

    it('should allow admin to update any user', async () => {
      const mockUpdateDto: UpdateUserDto = { username: 'newName' };
      const mockReq = { user: { userId: otherUserId, role: 'ADMIN' } };
      const updatedUser = {
        ...mockUser,
        username: 'newName',
        _id: '66c1234567890abcdef0123',
        save: jest.fn(),
      } as User;

      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update(updateId, mockUpdateDto, mockReq);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(updateId, mockUpdateDto);
    });

    it('should allow user to update their own info', async () => {
      const mockUpdateDto: UpdateUserDto = { username: 'newName' };
      const mockReq = { user: { userId: updateId, role: 'USER' } };
      const updatedUser = {
        ...mockUser,
        username: 'newName',
        _id: '66c1234567890abcdef0123',
        save: jest.fn(),
      } as User;

      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser);

      const result = await controller.update(updateId, mockUpdateDto, mockReq);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith(updateId, mockUpdateDto);
    });

    it('should throw ForbiddenException when regular user tries to update another user', async () => {
      const mockUpdateDto: UpdateUserDto = { username: 'newName' };
      // req用户id不等于更新的id，同时不是ADMIN
      const mockReq = { user: { userId: otherUserId, role: 'USER' } };

      await expect(
        controller.update(updateId, mockUpdateDto, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate email with verification code when email is updated', async () => {
      const mockUpdateDto: UpdateUserDto = {
        email: 'newemail@test.com',
        emailCode: '123456',
      };
      const mockReq = { user: { userId: updateId, role: 'USER' } };
      const updatedUser = {
        ...mockUser,
        email: 'newemail@test.com',
        _id: '66c1234567890abcdef0123',
        save: jest.fn(),
      } as User;

      // 设置验证服务和更新服务
      const completeMockUser = {
        _id: '66c1234567890abcdef0123',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$reallylonghashvaluehere',
        role: 'USER',
        avatar: '/assets/avatar/test.jpg',
        createdAt: new Date('2025-08-20T12:00:00.000Z'),
        updatedAt: new Date('2025-08-20T12:00:00.000Z'),
      } as User;

      jest
        .spyOn(usersService, 'findOneById')
        .mockResolvedValue(completeMockUser);
      jest
        .spyOn(validationService, 'validateCode')
        .mockResolvedValue(undefined as never);
      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser);
      jest
        .spyOn(validationService, 'clearCode')
        .mockResolvedValue(undefined as never);

      const result = await controller.update(updateId, mockUpdateDto, mockReq);

      expect(result).toEqual(updatedUser);
      expect(usersService.findOneById).toHaveBeenCalledWith(updateId);
      expect(validationService.validateCode).toHaveBeenCalledWith(
        mockUser.email,
        '123456',
        'update',
      );
      expect(usersService.update).toHaveBeenCalledWith(updateId, {
        email: 'newemail@test.com',
      });
      expect(validationService.clearCode).toHaveBeenCalledWith(
        updatedUser.email,
        'update',
      );
    });

    it('should throw BadRequestException when updating email without verification code', async () => {
      const mockUpdateDto: UpdateUserDto = { email: 'newemail@test.com' }; // 无emailCode
      const mockReq = { user: { userId: updateId, role: 'USER' } };

      await expect(
        controller.update(updateId, mockUpdateDto, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const userId = '66c1234567890abcdef0123';
      const mockRoleDto: UpdateRoleDto = { role: 'ADMIN' };
      const updatedUser = {
        ...mockUser,
        role: 'ADMIN',
        _id: '66c1234567890abcdef0123',
      } as User;

      jest.spyOn(usersService, 'updateRole').mockResolvedValue(updatedUser);

      const result = await controller.updateRole(userId, mockRoleDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.updateRole).toHaveBeenCalledWith(userId, 'ADMIN');
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const userId = '66c1234567890abcdef0123';
      jest.spyOn(usersService, 'remove').mockResolvedValue(null);

      const result = await controller.remove(userId);

      expect(result).toBeNull();
      expect(usersService.remove).toHaveBeenCalledWith(userId);
    });
  });

  describe('uploadAvatar', () => {
    const updateId = '66c1234567890abcdef0123';
    const otherUserId = '66c1234567890abcdef0124';
    const mockFile: Express.Multer.File = {
      fieldname: 'avatar',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from([]),
      destination: '/tmp',
      filename: 'avatar.png',
      path: '/tmp/avatar.png',
      stream: Readable.from(Buffer.from([])),
    };

    it('should allow user to upload their own avatar', async () => {
      const mockReq = { user: { userId: updateId, role: 'USER' } };
      const uploadedUrl = '/uploads/avatar.png';
      const updatedUser = {
        ...mockUser,
        avatar: uploadedUrl,
        _id: '66c1234567890abcdef0123',
        save: jest.fn(),
      } as User;

      jest.spyOn(storagesService, 'uploadFile').mockResolvedValue(uploadedUrl);
      jest.spyOn(usersService, 'updateAvatar').mockResolvedValue(updatedUser);

      const result = await controller.uploadAvatar(updateId, mockFile, mockReq);

      expect(result).toEqual(updatedUser);
      expect(storagesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'avatar',
      );
      expect(usersService.updateAvatar).toHaveBeenCalledWith(
        updateId,
        uploadedUrl,
      );
    });

    it('should allow admin to upload avatar for other users', async () => {
      const mockReq = { user: { userId: otherUserId, role: 'ADMIN' } };
      const uploadedUrl = '/uploads/avatar.png';
      const updatedUser = {
        ...mockUser,
        avatar: uploadedUrl,
        _id: '66c1234567890abcdef0123',
        save: jest.fn(),
      } as User;

      jest.spyOn(storagesService, 'uploadFile').mockResolvedValue(uploadedUrl);
      jest.spyOn(usersService, 'updateAvatar').mockResolvedValue(updatedUser);

      const result = await controller.uploadAvatar(updateId, mockFile, mockReq);

      expect(result).toEqual(updatedUser);
      expect(storagesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'avatar',
      );
      expect(usersService.updateAvatar).toHaveBeenCalledWith(
        updateId,
        uploadedUrl,
      );
    });

    it('should throw ForbiddenException when user tries to upload avatar for another user', async () => {
      const mockReq = { user: { userId: otherUserId, role: 'USER' } };

      await expect(
        controller.uploadAvatar(updateId, mockFile, mockReq),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      const mockReq = { user: { userId: updateId, role: 'USER' } };

      await expect(
        controller.uploadAvatar(updateId, undefined as any, mockReq),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
