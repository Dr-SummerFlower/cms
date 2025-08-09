import { MailerService } from '@nestjs-modules/mailer';
import { InjectRedis, Redis } from '@nestjs-redis/client';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendCodeDto } from './dto/send-code.dto';

/**
 * 邮件服务类
 * @description 处理邮件发送相关的业务逻辑，包括发送验证码邮件
 */
@Injectable()
export class EmailService {
  constructor(
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: MailerService,
  ) {}

  /**
   * 发送邮箱验证码
   * @description 生成6位数字验证码并发送到指定邮箱，验证码有效期为5分钟
   * @param dto 发送验证码的数据传输对象，包含邮箱地址和验证码类型
   * @returns 返回发送结果，包含成功状态
   * @throws {InternalServerErrorException} 当邮件发送失败时抛出异常
   */
  async sendCode(dto: SendCodeDto): Promise<{ success: boolean }> {
    const { email, type } = dto;

    try {
      const code: string = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const redisKey = `${type}:code:${email}`;

      await this.redisService.setEx(redisKey, 300, code);
      await this.emailService.sendMail({
        to: email,
        subject: '演唱会管理组',
        template: './verification-code',
        context: {
          code,
          email,
          type,
        },
      });

      return { success: true };
    } catch {
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }
}
