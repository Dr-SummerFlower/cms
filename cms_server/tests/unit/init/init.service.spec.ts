/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { InitService } from '../../../src/init/init.service';
import { StoragesService } from '../../../src/storages/storages.service';
import { User } from '../../../src/users/entities/user.entity';

describe('InitService', () => {
  let service: InitService;
  let userModel: Model<User>;
  let configService: ConfigService;
  let storagesService: StoragesService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: StoragesService,
          useValue: {
            uploadBuffer: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InitService>(InitService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    configService = module.get<ConfigService>(ConfigService);
    storagesService = module.get<StoragesService>(StoragesService);

    // Mock logger
    loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('应在模块初始化时调用 createDefaultAdmin', async () => {
      // 因为 createDefaultAdmin 是私有方法，我们需要直接测试 onModuleInit 的影响
      const findOneSpy = jest
        .spyOn(userModel, 'findOne')
        .mockResolvedValue(null);
      const createSpy = jest
        .spyOn(userModel, 'create')
        .mockResolvedValue({} as any);
      const uploadSpy = jest
        .spyOn(storagesService, 'uploadBuffer')
        .mockResolvedValue('avatar-url');

      (configService.get as jest.Mock).mockImplementation(
        (key: string, defaultValue: string) => {
          switch (key) {
            case 'ADMIN_USER':
              return 'admin';
            case 'ADMIN_EMAIL':
              return 'admin@example.com';
            case 'ADMIN_PWD':
              return 'admin123';
            default:
              return defaultValue;
          }
        },
      );

      await service.onModuleInit();

      // 虽然不能直接 spy 私有方法，但是我们可以通过验证效果进行测试
      expect(findOneSpy).toHaveBeenCalledWith({ role: 'ADMIN' });
      expect(uploadSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
    });
  });

  describe('完整工作流', () => {
    it('当管理员已存在时，不应创建管理员', async () => {
      // Arrange
      const existingAdmin = {
        role: 'ADMIN',
        username: 'existing-admin',
      };
      (userModel.findOne as jest.Mock).mockResolvedValue(existingAdmin);

      // Act
      await service['createDefaultAdmin'].call(service); // 使用 call 方法来测试私有方法

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ role: 'ADMIN' });
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it('当不存在管理员时，应创建默认管理员', async () => {
      // Arrange
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      const mockAvatarUrl = 'http://example.com/avatar.png';
      (storagesService.uploadBuffer as jest.Mock).mockResolvedValue(
        mockAvatarUrl,
      );

      const defaultUsername = 'admin';
      const defaultEmail = 'admin@example.com';
      const defaultPassword = 'admin123';

      (configService.get as jest.Mock).mockImplementation(
        (key: string, defaultValue: string) => {
          switch (key) {
            case 'ADMIN_USER':
              return defaultUsername;
            case 'ADMIN_EMAIL':
              return defaultEmail;
            case 'ADMIN_PWD':
              return defaultPassword;
            default:
              return defaultValue;
          }
        },
      );

      // Act
      await service['createDefaultAdmin'].call(service); // 使用 call 方法调用私有方法

      // Assert
      expect(userModel.findOne).toHaveBeenCalledWith({ role: 'ADMIN' });
      expect(storagesService.uploadBuffer).toHaveBeenCalled();
      expect(userModel.create).toHaveBeenCalledWith({
        username: defaultUsername,
        avatar: mockAvatarUrl,
        email: defaultEmail,
        password: defaultPassword,
        role: 'ADMIN',
      });
    });

    it('当创建管理员过程中发生错误时，应正确处理', async () => {
      // Arrange
      (userModel.findOne as jest.Mock).mockResolvedValue(null);

      const mockError = new Error('Upload failed');
      (storagesService.uploadBuffer as jest.Mock).mockRejectedValue(mockError);

      const consoleErrorSpy = jest
        .spyOn(global.console, 'error')
        .mockImplementation();

      (configService.get as jest.Mock).mockImplementation(
        (key: string, defaultValue: string) => {
          switch (key) {
            case 'ADMIN_USER':
              return 'admin';
            case 'ADMIN_EMAIL':
              return 'admin@example.com';
            case 'ADMIN_PWD':
              return 'admin123';
            default:
              return defaultValue;
          }
        },
      );

      const errorLogger = jest.spyOn(Logger.prototype, 'error');

      // Act
      await service['createDefaultAdmin'].call(service); // 使用 call 方法调用私有方法

      // Assert
      expect(errorLogger).toHaveBeenCalledWith(
        '创建默认管理员账户失败:',
        mockError,
      );
    });
  });
});
