import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InitService implements OnModuleInit {
  private readonly logger = new Logger(InitService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    try {
      const existingAdmin = await this.userModel.findOne({ role: 'ADMIN' });

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
        password: await bcrypt.hash(adminConfig.password, 10),
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
