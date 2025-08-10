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
        email: this.configService.get<string>(
          'ADMIN_EMAIL',
          'admin@concert.com',
        ),
        password: this.configService.get<string>('ADMIN_PWD', 'Admin123456'),
        role: 'ADMIN',
      };

      const defaultAdmin = {
        username: adminConfig.username,
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
