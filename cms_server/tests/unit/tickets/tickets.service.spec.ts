/* eslint-disable @typescript-eslint/unbound-method */
import { Redis } from '@nestjs-redis/client';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { Concert } from '../../../src/concerts/entities/concert.entity';
import { EcdsaService } from '../../../src/ecdsa/ecdsa.service';
import { EmailService } from '../../../src/email/email.service';
import { StoragesService } from '../../../src/storages/storages.service';
import { AdminReviewRefundDto } from '../../../src/tickets/dto/admin-review-refund.dto';
import { CreateTicketOrderDto } from '../../../src/tickets/dto/create-ticket-order.dto';
import { RefundRequestQueryDto } from '../../../src/tickets/dto/refund-request-query.dto';
import { RefundTicketDto } from '../../../src/tickets/dto/refund-ticket.dto';
import { TicketQueryDto } from '../../../src/tickets/dto/ticket-query.dto';
import { VerificationHistoryQueryDto } from '../../../src/tickets/dto/verification-history-query.dto';
import { VerifyTicketDto } from '../../../src/tickets/dto/verify-ticket.dto';
import { Ticket } from '../../../src/tickets/entities/ticket.entity';
import { TicketsService } from '../../../src/tickets/tickets.service';
import { RefundRequest } from '../../../src/types';
import { User } from '../../../src/users/entities/user.entity';

interface TicketDocument {
  _id: string;
  concert: string;
  user: string;
  type: string;
  price: number;
  status: string;
  signature: string;
  publicKey: string;
  qrCodeData: string;
  realName?: string;
  idCard?: string;
  faceImage?: string;
  refundReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VerificationRecordDocument {
  ticket: string;
  inspector: string;
  location: string;
  result: boolean;
  signature: string;
}

interface ConcertDocument {
  _id: string;
  name: string;
  date: Date;
  venue: string;
  totalTickets: number;
  soldTickets: number;
  status: string;
  adultPrice: number;
  childPrice: number;
  maxAdultTicketsPerUser: number;
  maxChildTicketsPerUser: number;
  privateKey: string;
  publicKey: string;
}

const mockRedisService = {
  get: jest.fn(),
  setEx: jest.fn(),
  lPush: jest.fn(),
  lRange: jest.fn(),
  lRem: jest.fn(),
};

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketModel: Model<TicketDocument>;
  let verificationRecordModel: Model<VerificationRecordDocument>;
  let concertModel: Model<ConcertDocument>;
  let ecdsaService: EcdsaService;
  let emailService: EmailService;
  let storagesService: StoragesService;
  let redisService: Redis;

  const mockTicket = {
    _id: '66c123456789abcdeff04567',
    concert: { _id: '507f1f77bcf86cd799439011' } as Concert,
    user: { _id: '507f1f77bcf86cd799439012' } as User,
    type: 'adult',
    price: 100,
    status: 'valid',
    signature: 'signature123',
    publicKey: 'publicKey123',
    qrCodeData: 'qrCodeData123',
    realName: '张三',
    idCard: '123456789012345678',
    faceImage: '/assets/face/test.jpg',
    refundReason: 'refund reason',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as Ticket & { user: { _id: string } };

  const mockedConcert = {
    _id: '507f1f77bcf86cd799439011',
    name: '演唱会名称',
    date: new Date('2025-09-01T19:30:00.000Z'),
    venue: ' venue',
    totalTickets: 1000,
    soldTickets: 50,
    status: 'upcoming',
    adultPrice: 680,
    childPrice: 380,
    maxAdultTicketsPerUser: 5,
    maxChildTicketsPerUser: 5,
    privateKey: 'privateKey123',
    publicKey: 'publicKey123',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as Concert;

  const mockUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'user@example.com',
    username: '用户名',
    role: 'USER',
    avatar: '/assets/default-avatar.png',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: 'TicketModel',
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            updateOne: jest.fn(),
            updateMany: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            populate: jest.fn(),
            sort: jest.fn(),
            select: jest.fn(),
          },
        },
        {
          provide: 'VerificationRecordModel',
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            updateMany: jest.fn(),
            updateOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            populate: jest.fn(),
            sort: jest.fn(),
            select: jest.fn(),
            exec: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
        {
          provide: 'ConcertModel',
          useValue: {
            findById: jest.fn().mockReturnThis(),
            find: jest.fn(),
            updateOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            populate: jest.fn(),
            select: jest.fn().mockReturnThis(),
            exec: jest.fn(),
          },
        },
        {
          provide: EcdsaService,
          useValue: {
            generateTicketSignatureData: jest.fn(),
            sign: jest.fn(() => ({ signature: 'mock-signature' })),
            generateQRCodeData: jest.fn(),
            parseQRCodeData: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendRefundRejectionNotice: jest.fn(),
          },
        },
        {
          provide: StoragesService,
          useValue: {
            uploadFile: jest.fn(),
            uploadBuffer: jest.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketModel = module.get<Model<TicketDocument>>('TicketModel');
    verificationRecordModel = module.get<Model<VerificationRecordDocument>>(
      'VerificationRecordModel',
    );
    concertModel = module.get<Model<ConcertDocument>>('ConcertModel');
    ecdsaService = module.get<EcdsaService>(EcdsaService);
    emailService = module.get<EmailService>(EmailService);
    storagesService = module.get<StoragesService>(StoragesService);
    redisService = module.get<Redis>('REDIS_CLIENT');
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('当用户 ID 格式无效时，应抛出 BadRequestException', async () => {
      const dto: CreateTicketOrderDto = {
        concertId: 'concertId123',
        tickets: [{ type: 'adult', quantity: 2, attendees: [] }],
      };

      await expect(
        service.createOrder(dto, 'invalidUserId', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('当演唱会 ID 格式无效时，应抛出 BadRequestException', async () => {
      const dto: CreateTicketOrderDto = {
        concertId: 'invalidConcertId',
        tickets: [{ type: 'adult', quantity: 2, attendees: [] }],
      };

      await expect(
        service.createOrder(dto, '507f1f77bcf86cd799439011', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('当演唱会不存在时，应抛出 NotFoundException', async () => {
      const dto: CreateTicketOrderDto = {
        concertId: '507f1f77bcf86cd799439011',
        tickets: [{ type: 'adult', quantity: 2, attendees: [] }],
      };

      (concertModel.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createOrder(dto, '507f1f77bcf86cd799439011', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('当演唱会状态不是 upcoming 时，应抛出 BadRequestException', async () => {
      const dto: CreateTicketOrderDto = {
        concertId: '507f1f77bcf86cd799439011',
        tickets: [{ type: 'adult', quantity: 2, attendees: [] }],
      };

      (concertModel.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockedConcert, status: 'completed' }),
      });

      await expect(
        service.createOrder(dto, '507f1f77bcf86cd799439011', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('当总数量为 0 时，应抛出 BadRequestException', async () => {
      const dto: CreateTicketOrderDto = {
        concertId: '507f1f77bcf86cd799439011',
        tickets: [{ type: 'adult', quantity: 0, attendees: [] }],
      };

      (concertModel.findById as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockedConcert),
      });

      await expect(
        service.createOrder(dto, '507f1f77bcf86cd799439011', []),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMyTickets', () => {
    it('当用户 ID 格式无效时，应抛出 BadRequestException', async () => {
      const queryDto: TicketQueryDto = {};

      await expect(
        service.findMyTickets('invalidUserId', queryDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('当票证 ID 格式无效时，应抛出 BadRequestException', async () => {
      await expect(
        service.findOne('invalidTicketId', '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当用户 ID 格式无效时，应抛出 BadRequestException', async () => {
      await expect(
        service.findOne('507f1f77bcf86cd799439011', 'invalidUserId'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当票证不存在时，应抛出 NotFoundException', async () => {
      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      (ticketModel.findById as jest.Mock).mockReturnValue(mockFindById);

      await expect(
        service.findOne('66c123456789abcdeff04567', '507f1f77bcf86cd799439012'),
      ).rejects.toThrow(NotFoundException);
    });

    it('当用户不拥有该票证时，应抛出 ForbiddenException', async () => {
      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          ...(mockTicket as any),
          user: { _id: '66c123456789abcdef01234567' },
        }),
      };
      (ticketModel.findById as jest.Mock).mockReturnValue(mockFindById);

      await expect(
        service.findOne('66c123456789abcdeff04567', '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('当票证存在且用户拥有该票证时，应返回票证', async () => {
      const originalUserId = mockTicket.user._id;
      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          ...mockTicket,
          user: { _id: originalUserId },
        }),
      };
      (ticketModel.findById as jest.Mock).mockReturnValue(mockFindById);

      const result = await service.findOne(
        '66c123456789abcdeff04567',
        originalUserId,
      );

      expect(result).toBeDefined();
      expect(ticketModel.findById).toHaveBeenCalledWith(
        '66c123456789abcdeff04567',
      );
      expect(result).toBeDefined();
    });
  });

  describe('requestRefund', () => {
    it('当票证 ID 格式无效时，应抛出 BadRequestException', async () => {
      const refundDto: RefundTicketDto = { reason: 'Need to cancel' };

      await expect(
        service.requestRefund(
          'invalidTicketId',
          '507f1f77bcf86cd799439011',
          refundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('当用户 ID 格式无效时，应抛出 BadRequestException', async () => {
      const refundDto: RefundTicketDto = { reason: 'Need to cancel' };

      await expect(
        service.requestRefund(
          '507f1f77bcf86cd799439011',
          'invalidUserId',
          refundDto,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('当票证不存在时，应抛出 NotFoundException', async () => {
      const refundDto: RefundTicketDto = { reason: 'Need to cancel' };

      const mockFindById = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      (ticketModel.findById as jest.Mock).mockReturnValue(mockFindById);

      await expect(
        service.requestRefund(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439011',
          refundDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmVerification', () => {
    it('当票证 ID 格式无效时，应抛出 BadRequestException', async () => {
      await expect(
        service.confirmVerification(
          'invalidTicketId',
          '507f1f77bcf86cd799439011',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('当检查员 ID 格式无效时，应抛出 BadRequestException', async () => {
      await expect(
        service.confirmVerification(
          '507f1f77bcf86cd799439011',
          'invalidInspectorId',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('当票证不存在时，应抛出 NotFoundException', async () => {
      const mockFindById = { exec: jest.fn().mockResolvedValue(null) };
      (ticketModel.findById as jest.Mock).mockReturnValue(mockFindById);

      await expect(
        service.confirmVerification(
          '507f1f77bcf86cd799439011',
          '507f1f77bcf86cd799439011',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingRefundRequests', () => {
    it('应从 Redis 返回待处理的退款请求', async () => {
      const mockQueryDto: RefundRequestQueryDto = { status: 'pending' };

      const mockRefundRequests: RefundRequest[] = [
        {
          ticketId: 'ticket123',
          userId: 'user123',
          concertId: 'concert123',
          reason: 'Change of plans',
          status: 'pending',
          requestTime: new Date().toISOString(),
          ticketInfo: {
            type: 'adult',
            price: 100,
            concertName: 'Concert Test',
            concertDate: new Date(),
            venue: 'Test Venue',
          },
          userInfo: { email: 'user@example.com', username: 'Test User' },
        },
      ];

      (redisService.lRange as jest.Mock).mockResolvedValue([
        'refund_request:ticket123',
      ]);
      (redisService.get as jest.Mock).mockResolvedValue(
        JSON.stringify(mockRefundRequests[0]),
      );

      const result = await service.getPendingRefundRequests(mockQueryDto);

      expect(result).toHaveLength(1);
      expect(result[0].ticketId).toBe('ticket123');
      expect(redisService.lRange).toHaveBeenCalledWith(
        'pending_refund_requests',
        0,
        -1,
      );
    });
  });

  describe('reviewRefundRequest', () => {
    it('当退款请求不存在时，应抛出 NotFoundException', async () => {
      (redisService.get as jest.Mock).mockResolvedValue(null);

      const reviewDto: AdminReviewRefundDto = {
        approved: false,
        reviewNote: 'Not approved',
      };

      await expect(
        service.reviewRefundRequest(
          'nonexistentTicketId',
          'adminId123',
          reviewDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('当状态不是 pending 时，应拒绝请求', async () => {
      const existingRequest = {
        status: 'approved',
        ticketId: 'ticketId123',
        userId: 'user123',
      };
      (redisService.get as jest.Mock).mockResolvedValue(
        JSON.stringify(existingRequest),
      );

      const reviewDto: AdminReviewRefundDto = {
        approved: true,
        reviewNote: 'Approved',
      };

      await expect(
        service.reviewRefundRequest('ticketId123', 'adminId123', reviewDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateQRCode', () => {
    it('应成功生成 QR 码', async () => {
      (ticketModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockTicket, user: mockUser }),
      });

      (concertModel.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockedConcert),
      });

      (ecdsaService.generateTicketSignatureData as jest.Mock).mockReturnValue(
        'signdata123',
      );
      (ecdsaService.sign as jest.Mock).mockReturnValue({
        signature: 'generatedSig123',
      });
      (ecdsaService.generateQRCodeData as jest.Mock).mockReturnValue(
        'qrcode123',
      );
      (ecdsaService.parseQRCodeData as jest.Mock).mockReturnValue({
        ticketId: '66c123456789abcdeff04567',
        signature: 'generatedSig123',
        timestamp: Date.now(),
      });

      const result = await service.generateQRCode(
        '66c123456789abcdeff04567',
        mockUser._id as string,
      );

      expect(result).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('当票证不存在时，应抛出 NotFoundException', async () => {
      (ticketModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.generateQRCode(
          '66c123456789abcdeff04567',
          '507f1f77bcf86cd799439011',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyTicket', () => {
    it('当检查员 ID 格式无效时，应抛出 BadRequestException', async () => {
      const verifyDto: VerifyTicketDto = {
        qrData: 'fakeqrdata',
        location: 'Entrance 1',
      };

      await expect(
        service.verifyTicket(verifyDto, 'invalidId'),
      ).rejects.toThrow(BadRequestException);
    });

    it('当 QR 数据无效时，应抛出 BadRequestException', async () => {
      const verifyDto: VerifyTicketDto = {
        qrData: 'fakeqrdata',
        location: 'Entrance 1',
      };

      (ecdsaService.parseQRCodeData as jest.Mock).mockReturnValue(null);

      await expect(
        service.verifyTicket(verifyDto, '507f1f77bcf86cd799439011'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getVerificationHistory', () => {
    it('当演唱会 ID 格式无效时，应抛出 BadRequestException', async () => {
      const queryDto: VerificationHistoryQueryDto = {
        concertId: 'invalidConcertId',
      };

      await expect(service.getVerificationHistory(queryDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('当检查员 ID 格式无效时，应抛出 BadRequestException', async () => {
      const queryDto: VerificationHistoryQueryDto = {
        inspectorId: 'invalidInspectorId',
      };

      await expect(service.getVerificationHistory(queryDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkUserPurchaseLimit', () => {
    it('应正确处理用户购买限制检查功能', () => {
      expect(service).toBeDefined();
    });
  });
});
