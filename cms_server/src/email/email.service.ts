import { MailerService } from '@nestjs-modules/mailer';
import { InjectRedis, Redis } from '@nestjs-redis/client';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SendCodeDto } from './dto/send-code.dto';

/**
 * 负责发送验证码、提醒与通知邮件的服务。
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRedis() private readonly redisService: Redis,
    private readonly emailService: MailerService,
  ) {}

  /**
   * 发送邮箱验证码并将验证码短期缓存到 Redis。
   *
   * @param dto - 验证码发送参数
   * @returns 邮件发送成功标记
   * @throws InternalServerErrorException 当验证码缓存或发信失败时抛出
   */
  async sendCode(dto: SendCodeDto): Promise<{ success: boolean }> {
    const { email, type } = dto;

    try {
      const code: string = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const redisKey = `${type}:code:${email}`;

      // 先缓存验证码，保证用户收到邮件后可以立刻参与注册或资料修改校验。
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
    } catch (error) {
      this.logger.error(
        `发送验证码邮件失败 [type=${type}, email=${email}] [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('邮件发送失败，请稍后重试');
    }
  }

  /**
   * 发送演唱会开始前的提醒邮件。
   *
   * @param email - 收件人邮箱
   * @param concertInfo - 演唱会信息
   * @returns 邮件发送成功标记
   * @throws InternalServerErrorException 当邮件发送失败时抛出
   */
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
      // 提醒邮件由定时任务触发，模板中直接使用格式化后的演出时间与场馆信息。
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
    } catch (error) {
      this.logger.error(
        `发送演唱会提醒邮件失败 [concert=${concertInfo.name}, email=${email}] [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        '演唱会提醒邮件发送失败，请稍后重试',
      );
    }
  }

  /**
   * 发送退票申请被拒绝的通知邮件。
   *
   * @param email - 收件人邮箱
   * @param refundInfo - 退票申请信息
   * @returns 邮件发送成功标记
   * @throws InternalServerErrorException 当邮件发送失败时抛出
   */
  async sendRefundRejectionNotice(
    email: string,
    refundInfo: {
      username: string;
      concertName: string;
      reason: string;
    },
  ): Promise<{ success: boolean }> {
    try {
      // 拒绝原因直接写入模板，方便用户理解为何本次退票未被通过。
      await this.emailService.sendMail({
        to: email,
        subject: `退票申请结果通知 - ${refundInfo.concertName}`,
        template: './refund-rejection',
        context: {
          username: refundInfo.username,
          concertName: refundInfo.concertName,
          rejectionReason: refundInfo.reason,
          // 模板中直接展示中国时区时间，避免不同部署环境产生歧义。
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
    } catch (error) {
      this.logger.error(
        `发送退票拒绝通知邮件失败 [concert=${refundInfo.concertName}, email=${email}] [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        '退票拒绝通知邮件发送失败，请稍后重试',
      );
    }
  }
}
