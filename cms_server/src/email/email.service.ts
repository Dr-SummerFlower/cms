import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-redis/client';
import { MailerService } from '@nestjs-modules/mailer';
import { SendCodeDto } from './dto/send-code.dto';

@Injectable()
export class EmailService {
  private readonly logger: Logger = new Logger(EmailService.name);

  constructor(
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: MailerService,
  ) {}

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
    } catch (error) {
      this.logger.warn(error);
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }
}
