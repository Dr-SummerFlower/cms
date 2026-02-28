/* eslint-disable @typescript-eslint/unbound-method */
import { MailerService } from '@nestjs-modules/mailer';
import { Redis, RedisToken } from '@nestjs-redis/client';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SendCodeDto } from '../../../src/email/dto/send-code.dto';
import { EmailService } from '../../../src/email/email.service';

const REDIS_CLIENT = RedisToken();

const mockRedisService = {
  setEx: jest.fn(),
};

const mockMailerService = {
  sendMail: jest.fn(),
};

describe('EmailService', () => {
  let service: EmailService;
  let redisService: Redis;
  let mailerService: MailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedisService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    redisService = module.get(REDIS_CLIENT);
    mailerService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('sendCode', () => {
    const sendCodeDto: SendCodeDto = {
      email: 'test@example.com',
      type: 'register',
    };

    it('应成功生成验证码并存储到 Redis', async () => {
      // Arrange
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      const result = await service.sendCode(sendCodeDto);

      // Assert
      expect(result).toEqual({ success: true });
      expect(redisService.setEx).toHaveBeenCalledWith(
        'register:code:test@example.com',
        300, // 60 * 5 = 5分钟
        expect.any(String), // 验证码是6位数字
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: sendCodeDto.email,
        subject: '演唱会管理组',
        template: './verification-code',
        context: {
          code: expect.any(String),
          email: sendCodeDto.email,
          type: sendCodeDto.type,
        },
      });
    });

    it('生成的验证码应为6位数字', async () => {
      // Arrange
      const setExSpy = jest
        .spyOn(redisService, 'setEx')
        .mockResolvedValue('OK');
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      await service.sendCode(sendCodeDto);

      // Assert
      const calledWithArgs = setExSpy.mock.calls[0];
      const code = calledWithArgs[2]; // 第三个参数是验证码值
      expect(code).toMatch(/^\d{6}$/); // 6 位数字
      const numericCode = parseInt(code as string, 10);
      expect(numericCode).toBeGreaterThanOrEqual(100000);
      expect(numericCode).toBeLessThanOrEqual(999999);
    });

    it('当类型为 update 时，应使用正确的 Redis key', async () => {
      // Arrange
      const updateDto = { email: 'test@example.com', type: 'update' as const };
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      await service.sendCode(updateDto);

      // Assert
      expect(redisService.setEx).toHaveBeenCalledWith(
        'update:code:test@example.com',
        300,
        expect.any(String),
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: updateDto.email,
        subject: '演唱会管理组',
        template: './verification-code',
        context: {
          code: expect.any(String),
          email: updateDto.email,
          type: updateDto.type,
        },
      });
    });

    it('当邮件发送失败时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest.spyOn(redisService, 'setEx').mockResolvedValue('OK');
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error('Send failed'));

      // Act & Assert
      await expect(service.sendCode(sendCodeDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.sendCode(sendCodeDto)).rejects.toThrow(
        '邮件发送失败，请稍后重试',
      );
    });

    it('当Redis存储失败时，应仍能完成邮件发送', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'setEx')
        .mockRejectedValue(new Error('Redis error'));
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act & Assert
      await expect(service.sendCode(sendCodeDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.sendCode(sendCodeDto)).rejects.toThrow(
        '邮件发送失败，请稍后重试',
      );
    });
  });

  describe('sendConcertReminder', () => {
    const email = 'user@example.com';
    const concertInfo = {
      name: '演唱会A',
      date: new Date('2024-12-25T19:00:00'),
      venue: '北京工人体育馆',
      description: '夏日音乐节',
    };

    it('应成功发送演唱会提醒邮件', async () => {
      // Arrange
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      const result = await service.sendConcertReminder(email, concertInfo);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: `演唱会提醒 - ${concertInfo.name}`,
        template: './concert-reminder',
        context: {
          concertName: concertInfo.name,
          concertDate: expect.any(String), // 格式化的日期字符串
          venue: concertInfo.venue,
          description: concertInfo.description,
        },
      });
    });

    it('应正确定义日期格式为中文格式', async () => {
      // Arrange
      const sendMailSpy = jest
        .spyOn(mailerService, 'sendMail')
        .mockResolvedValue({});

      // Act
      await service.sendConcertReminder(email, concertInfo);

      // Assert
      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.context).toBeDefined();
      if (mailOptions.context) {
        expect(mailOptions.context.concertDate).toMatch(/\d{4}\/\d{2}\/\d{2}/); // 日期格式：YYYY/MM/DD
      }
    });

    it('当传入不带描述的演唱会信息时，也应发送提醒邮件', async () => {
      // Arrange
      const concertInfoWithoutDesc = {
        name: '演唱会B',
        date: new Date('2024-11-20T20:00:00'),
        venue: '上海东方体育中心',
      };
      const expectedSubject = `演唱会提醒 - ${concertInfoWithoutDesc.name}`;

      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      const result = await service.sendConcertReminder(
        email,
        concertInfoWithoutDesc,
      );

      // Assert
      expect(result).toEqual({ success: true });
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: expectedSubject,
        template: './concert-reminder',
        context: {
          concertName: concertInfoWithoutDesc.name,
          concertDate: expect.any(String),
          venue: concertInfoWithoutDesc.venue,
          description: undefined,
        },
      });
    });

    it('当邮件发送失败时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error('Send failed'));

      // Act & Assert
      await expect(
        service.sendConcertReminder(email, concertInfo),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.sendConcertReminder(email, concertInfo),
      ).rejects.toThrow('演唱会提醒邮件发送失败，请稍后重试');
    });
  });

  describe('sendRefundRejectionNotice', () => {
    const email = 'user@example.com';
    const refundInfo = {
      username: 'testUser',
      concertName: '音乐节C',
      reason: '申请不符合退票规则',
    };

    it('应成功发送退票拒绝通知邮件', async () => {
      // Arrange
      jest.spyOn(mailerService, 'sendMail').mockResolvedValue({});

      // Act
      const result = await service.sendRefundRejectionNotice(email, refundInfo);

      // Assert
      expect(result).toEqual({ success: true });
      expect(mailerService.sendMail).toHaveBeenCalledWith({
        to: email,
        subject: `退票申请结果通知 - ${refundInfo.concertName}`,
        template: './refund-rejection',
        context: {
          username: refundInfo.username,
          concertName: refundInfo.concertName,
          rejectionReason: refundInfo.reason,
          currentDate: expect.any(String), // 当前日期格式化
        },
      });
    });

    it('应生成当前日期的格式化版本', async () => {
      // Arrange
      const sendMailSpy = jest
        .spyOn(mailerService, 'sendMail')
        .mockResolvedValue({});

      // Act
      await service.sendRefundRejectionNotice(email, refundInfo);

      // Assert
      const mailOptions = sendMailSpy.mock.calls[0][0];
      expect(mailOptions.context).toBeDefined();
      if (mailOptions.context) {
        expect(mailOptions.context.currentDate).toMatch(/\d{4}\/\d{2}\/\d{2}/); // 日期格式：YYYY/MM/DD
      }
    });

    it('当邮件发送失败时，应抛出 InternalServerErrorException', async () => {
      // Arrange
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValue(new Error('Send failed'));

      // Act & Assert
      await expect(
        service.sendRefundRejectionNotice(email, refundInfo),
      ).rejects.toThrow(InternalServerErrorException);
      await expect(
        service.sendRefundRejectionNotice(email, refundInfo),
      ).rejects.toThrow('退票拒绝通知邮件发送失败，请稍后重试');
    });
  });
});
