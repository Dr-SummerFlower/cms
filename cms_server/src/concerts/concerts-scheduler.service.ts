import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../email/email.service';
import { ConcertsReminder } from '../types';
import { ConcertsService } from './concerts.service';

@Injectable()
export class ConcertsSchedulerService {
  private readonly logger: Logger = new Logger(ConcertsSchedulerService.name);

  constructor(
    private readonly concertsService: ConcertsService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleConcertStatusUpdate(): Promise<void> {
    this.logger.log('开始执行演唱会状态更新任务');

    try {
      await this.concertsService.updateConcertStatuses();
      this.logger.log('演唱会状态更新任务执行成功');
    } catch (error) {
      this.logger.error('演唱会状态更新任务执行失败', error.stack);
    }
  }

  @Cron('0 2 * * *')
  async handleDailyConcertStatusUpdate() {
    await this.concertsService.updateConcertStatuses();
    this.logger.log('演唱会状态更新成功');
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleConcertReminderEmails(): Promise<void> {
    const concertsForReminder: ConcertsReminder[] =
      await this.concertsService.getConcertsForReminder();

    if (concertsForReminder.length === 0) {
      return;
    }

    for (const { concert, userEmails } of concertsForReminder) {
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
  }
}
