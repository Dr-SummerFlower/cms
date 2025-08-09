import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

/**
 * 邮件模块
 * @description 配置邮件相关的服务和控制器，提供邮件发送功能
 */
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
