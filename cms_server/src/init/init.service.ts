import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';

/**
 * 初始化服务类
 * @description 应用启动时的初始化服务，负责创建默认管理员账户等初始化操作
 */
@Injectable()
export class InitService implements OnModuleInit {
  private readonly logger: Logger = new Logger(InitService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 模块初始化钩子
   * @description 在模块初始化时自动执行，创建默认管理员账户
   * @returns void
   */
  async onModuleInit(): Promise<void> {
    await this.createDefaultAdmin();
  }

  /**
   * 创建默认管理员账户
   * @description 检查系统中是否存在管理员账户，如果不存在则创建默认管理员
   * @returns void
   * @private
   */
  private async createDefaultAdmin(): Promise<void> {
    try {
      const existingAdmin: User = (await this.userModel.findOne({
        role: 'ADMIN',
      })) as User;

      if (existingAdmin) {
        return;
      }

      const adminConfig = {
        username: this.configService.get<string>('ADMIN_USER', 'admin'),
        avatar:
          'data:image/png;base64,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',
        email: this.configService.get<string>(
          'ADMIN_EMAIL',
          'admin@concert.com',
        ),
        password: this.configService.get<string>('ADMIN_PWD', 'Admin123456'),
        role: 'ADMIN',
      };

      const defaultAdmin = {
        username: adminConfig.username,
        avatar: adminConfig.avatar,
        email: adminConfig.email,
        password: adminConfig.password,
        role: adminConfig.role,
      };

      await this.userModel.create(defaultAdmin);
      this.logger.log('默认管理员账户创建成功');
      this.logger.log(`用户名: ${adminConfig.username}`);
      this.logger.log(`邮箱: ${adminConfig.email}`);
      this.logger.log(`密码: ${adminConfig.password}`);
      this.logger.log('请及时修改默认密码！');
    } catch (error) {
      this.logger.error('创建默认管理员账户失败:', error);
    }
  }
}
