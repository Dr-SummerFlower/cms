/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsSchedulerService } from '../../../src/concerts/concerts-scheduler.service';
import { ConcertsService } from '../../../src/concerts/concerts.service';
import { Concert } from '../../../src/concerts/entities/concert.entity';
import { EmailService } from '../../../src/email/email.service';

const createConcertEntity = (overrides: Partial<Concert> = {}): Concert =>
  ({
    _id: '66c1234567890abcdef0456',
    name: '周杰伦2025世界巡回演唱会-北京站',
    poster: 'http://localhost:9000/assets/poster/test.png',
    date: new Date('2025-09-01T19:30:00.000Z'),
    venue: '北京国家体育场（鸟巢）',
    adultPrice: 680,
    childPrice: 380,
    totalTickets: 5000,
    soldTickets: 0,
    maxAdultTicketsPerUser: 2,
    maxChildTicketsPerUser: 1,
    status: 'upcoming',
    description: '本次巡演将带来全新曲目与经典回顾',
    publicKey: 'publicKey',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
    ...overrides,
  }) as Concert;

describe('ConcertsSchedulerService', () => {
  let service: ConcertsSchedulerService;
  let concertsService: ConcertsService;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsSchedulerService,
        {
          provide: ConcertsService,
          useValue: {
            updateConcertStatuses: jest.fn(),
            getConcertsForReminder: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendConcertReminder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConcertsSchedulerService>(ConcertsSchedulerService);
    concertsService = module.get<ConcertsService>(ConcertsService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('应定义服务实例', () => {
    expect(service).toBeDefined();
  });

  describe('handleConcertStatusUpdate', () => {
    it('当执行成功时，应调用更新并记录日志', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      (concertsService.updateConcertStatuses as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleConcertStatusUpdate();

      expect(concertsService.updateConcertStatuses).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('开始执行演唱会状态更新任务');
      expect(logSpy).toHaveBeenCalledWith('演唱会状态更新任务执行成功');
    });

    it('当执行失败时，应记录错误日志', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const error = new Error('fail');
      error.stack = 'stack';

      (concertsService.updateConcertStatuses as jest.Mock).mockRejectedValue(
        error,
      );

      await service.handleConcertStatusUpdate();

      expect(errorSpy).toHaveBeenCalledWith(
        '演唱会状态更新任务执行失败',
        'stack',
      );
    });
  });

  describe('handleDailyConcertStatusUpdate', () => {
    it('当执行成功时，应调用更新并记录日志', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      (concertsService.updateConcertStatuses as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleDailyConcertStatusUpdate();

      expect(concertsService.updateConcertStatuses).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('演唱会状态更新成功');
    });
  });

  describe('handleConcertReminderEmails', () => {
    it('当没有需要提醒的演唱会时，应直接返回', async () => {
      (concertsService.getConcertsForReminder as jest.Mock).mockResolvedValue(
        [],
      );

      await service.handleConcertReminderEmails();

      expect(emailService.sendConcertReminder).not.toHaveBeenCalled();
    });

    it('当存在需要提醒的演唱会时，应发送提醒邮件并记录日志', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      const concert = createConcertEntity();

      (concertsService.getConcertsForReminder as jest.Mock).mockResolvedValue([
        { concert, userEmails: ['a@test.com', 'b@test.com'] },
      ]);
      (emailService.sendConcertReminder as jest.Mock).mockResolvedValue({
        success: true,
      });

      await service.handleConcertReminderEmails();

      expect(emailService.sendConcertReminder).toHaveBeenCalledTimes(2);
      expect(emailService.sendConcertReminder).toHaveBeenCalledWith(
        'a@test.com',
        {
          name: concert.name,
          date: concert.date,
          venue: concert.venue,
          description: concert.description,
        },
      );
      expect(logSpy).toHaveBeenCalledWith('成功发送 2 个演唱会提醒邮件');
    });
  });
});
