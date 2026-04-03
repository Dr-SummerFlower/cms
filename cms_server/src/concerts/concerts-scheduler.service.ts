import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { ConcertsReminder } from '../types';
import { ConcertsService } from './concerts.service';

/**
 * 负责执行演唱会状态维护与提醒邮件发送的定时任务服务。
 */
@Injectable()
export class ConcertsSchedulerService {
  private readonly logger: Logger = new Logger(ConcertsSchedulerService.name);

  constructor(
    private readonly concertsService: ConcertsService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 每小时执行一次演唱会状态更新任务。
   *
   * @returns 任务执行完成时不返回内容
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleConcertStatusUpdate(): Promise<void> {
    this.logger.log('开始执行演唱会状态更新任务');

    try {
      await this.concertsService.updateConcertStatuses();
      this.logger.log('演唱会状态更新任务执行成功');
    } catch (error) {
      this.logger.error(
        `演唱会状态更新任务执行失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * 每日凌晨额外执行一次演唱会状态更新任务。
   *
   * @returns 任务执行完成时不返回内容
   */
  @Cron('0 2 * * *')
  async handleDailyConcertStatusUpdate(): Promise<void> {
    try {
      await this.concertsService.updateConcertStatuses();
      this.logger.log('演唱会状态更新成功');
    } catch (error) {
      this.logger.error(
        `每日演唱会状态更新任务执行失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * 每小时检查并发送即将开场演唱会的提醒邮件。
   *
   * @returns 任务执行完成时不返回内容
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleConcertReminderEmails(): Promise<void> {
    try {
      const concertsForReminder: ConcertsReminder[] =
        await this.concertsService.getConcertsForReminder();

      if (concertsForReminder.length === 0) {
        return;
      }

      for (const { concert, userEmails } of concertsForReminder) {
        // 同一场演唱会的提醒邮件并发发送，单封失败不阻断其他用户通知。
        const emailPromises: Promise<{
          success: boolean;
        }>[] = userEmails.map(
          async (email: string): Promise<{ success: boolean }> =>
            await this.emailService.sendConcertReminder(email, {
              name: concert.name,
              date: concert.date,
              venue: concert.venue,
              description: concert.description,
            }),
        );

        const results: PromiseSettledResult<{ success: boolean }>[] =
          await Promise.allSettled(emailPromises);
        const successCount: number = results.filter(
          (result: PromiseSettledResult<{ success: boolean }>): boolean =>
            result.status === 'fulfilled' && result.value.success !== false,
        ).length;
        this.logger.log(`成功发送 ${successCount} 个演唱会提醒邮件`);
      }
    } catch (error) {
      this.logger.error(
        `演唱会提醒邮件任务执行失败 [${error instanceof Error ? error.constructor.name : typeof error}]: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
