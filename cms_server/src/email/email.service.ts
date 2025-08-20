import { MailerService } from '@nestjs-modules/mailer';
import { InjectRedis, Redis } from '@nestjs-redis/client';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SendCodeDto } from './dto/send-code.dto';

@Injectable()
export class EmailService {
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

      await this.redisService.setEx(redisKey, 60 * 5, code);
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

  async sendConcertReminder(
    email: string,
    concertInfo: {
      name: string;
      date: Date;
      venue: string;
      description?: string;
    },
  ): Promise<{ success: boolean }> {
    try {
      await this.emailService.sendMail({
        to: email,
        subject: `演唱会提醒 - ${concertInfo.name}`,
        template: './concert-reminder',
        context: {
          concertName: concertInfo.name,
          concertDate: concertInfo.date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Shanghai',
          }),
          venue: concertInfo.venue,
          description: concertInfo.description,
        },
      });

      return { success: true };
    } catch {
      throw new InternalServerErrorException(
        '演唱会提醒邮件发送失败，请稍后重试',
      );
    }
  }

  async sendRefundRejectionNotice(
    email: string,
    refundInfo: {
      username: string;
      concertName: string;
      reason: string;
    },
  ): Promise<{ success: boolean }> {
    try {
      await this.emailService.sendMail({
        to: email,
        subject: `退票申请结果通知 - ${refundInfo.concertName}`,
        template: './refund-rejection',
        context: {
          username: refundInfo.username,
          concertName: refundInfo.concertName,
          rejectionReason: refundInfo.reason,
          currentDate: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Shanghai',
          }),
        },
      });

      return { success: true };
    } catch {
      throw new InternalServerErrorException(
        '退票拒绝通知邮件发送失败，请稍后重试',
      );
    }
  }
}
