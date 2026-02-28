/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminReviewRefundDto } from '../../../src/tickets/dto/admin-review-refund.dto';
import { ConfirmVerificationDto } from '../../../src/tickets/dto/confirm-verification.dto';
import { CreateTicketOrderDto } from '../../../src/tickets/dto/create-ticket-order.dto';
import { RefundRequestQueryDto } from '../../../src/tickets/dto/refund-request-query.dto';
import { RefundTicketDto } from '../../../src/tickets/dto/refund-ticket.dto';
import { TicketQueryDto } from '../../../src/tickets/dto/ticket-query.dto';
import { VerificationHistoryQueryDto } from '../../../src/tickets/dto/verification-history-query.dto';
import { VerifyTicketDto } from '../../../src/tickets/dto/verify-ticket.dto';
import { Ticket } from '../../../src/tickets/entities/ticket.entity';
import {
  TicketsController,
  VerifyController,
} from '../../../src/tickets/tickets.controller';
import { TicketsService } from '../../../src/tickets/tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicket = {
    _id: '66c1234567890abcdef0456',
    concert: {
      _id: '66c1234567890abcdef0456',
      name: '演唱会名称',
      date: new Date(),
      venue: 'venue',
    },
    user: {
      _id: '66u000000000000000000001',
      username: '用户名',
      email: 'user@example.com',
    },
    type: 'adult',
    price: 100,
    status: 'valid',
    signature: 'signature123',
    publicKey: 'publicKey123',
    qrCodeData: 'qrCodeData123',
    realName: '张三',
    idCard: '123456789012345678',
    faceImage: '/assets/face/test.jpg',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as Ticket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            createOrder: jest.fn(),
            findMyTickets: jest.fn(),
            findOne: jest.fn(),
            requestRefund: jest.fn(),
            getPendingRefundRequests: jest.fn(),
            reviewRefundRequest: jest.fn(),
            generateQRCode: jest.fn(),
            verifyTicket: jest.fn(),
            confirmVerification: jest.fn(),
            getVerificationHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should call service.createOrder with provided data', async () => {
      const createTicketOrderDto: Partial<CreateTicketOrderDto> = {
        concertId: '66c1234567890abcdef0456',
        tickets: [
          {
            type: 'adult',
            quantity: 2,
            attendees: [],
          },
        ],
      };

      const mockFile = {
        fieldname: 'faceImage',
        originalname: 'face.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/tmp',
        filename: 'face.jpg',
        path: '/tmp/face.jpg',
        size: 1024,
        buffer: Buffer.from('mock image data'),
      } as Express.Multer.File;
      const mockFiles = [mockFile];
      const mockReq = { user: { userId: '66u000000000000000000001' } };
      const mockResult = [mockTicket];

      (service.createOrder as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.createOrder(
        { data: JSON.stringify(createTicketOrderDto) },
        mockFiles,
        mockReq,
      );

      expect(service.createOrder).toHaveBeenCalledWith(
        createTicketOrderDto,
        '66u000000000000000000001',
        mockFiles,
      );
      expect(result).toBe(mockResult);
    });

    it('should parse order data from string if data field exists', async () => {
      const createTicketOrderDto: Partial<CreateTicketOrderDto> = {
        concertId: '66c1234567890abcdef0456',
        tickets: [
          {
            type: 'child',
            quantity: 1,
            attendees: [],
          },
        ],
      };

      const mockFile = {
        fieldname: 'faceImage',
        originalname: 'face.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/tmp',
        filename: 'face.jpg',
        path: '/tmp/face.jpg',
        size: 1024,
        buffer: Buffer.from('mock image data'),
      } as Express.Multer.File;
      const mockFiles = [mockFile];
      const mockReq = { user: { userId: '66u000000000000000000001' } };
      const mockResult = [mockTicket];

      (service.createOrder as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.createOrder(
        { data: JSON.stringify(createTicketOrderDto) },
        mockFiles,
        mockReq,
      );

      expect(service.createOrder).toHaveBeenCalledWith(
        createTicketOrderDto,
        '66u000000000000000000001',
        mockFiles,
      );
      expect(result).toBe(mockResult);
    });

    it('should throw BadRequestException if data is not valid JSON', async () => {
      const mockFile = {
        fieldname: 'faceImage',
        originalname: 'face.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: '/tmp',
        filename: 'face.jpg',
        path: '/tmp/face.jpg',
        size: 1024,
        buffer: Buffer.from('mock image data'),
      } as Express.Multer.File;
      const mockFiles = [mockFile] as Express.Multer.File[];
      const mockReq = { user: { userId: '66u000000000000000000001' } };

      await expect(
        controller.createOrder(
          { data: 'invalid_json_string' },
          mockFiles,
          mockReq,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyTickets', () => {
    it('should call service.findMyTickets with query and user ID', async () => {
      const mockQuery: TicketQueryDto = { status: 'valid' };
      const mockUserId = '66u00000000000000000001';
      const mockResult = [mockTicket];

      (service.findMyTickets as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getMyTickets(mockQuery, {
        user: { userId: mockUserId },
      });

      expect(service.findMyTickets).toHaveBeenCalledWith(mockUserId, mockQuery);
      expect(result).toBe(mockResult);
    });
  });

  describe('getTicketDetail', () => {
    it('should call service.findOne with ticket and user IDs', async () => {
      const ticketId = '66c1234567890abcdef0456';
      const userId = '66u00000000000000000001';
      const mockResult = mockTicket;

      (service.findOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getTicketDetail(ticketId, {
        user: { userId: userId },
      });

      expect(service.findOne).toHaveBeenCalledWith(ticketId, userId);
      expect(result).toBe(mockResult);
    });
  });

  describe('requestRefund', () => {
    it('should call service.requestRefund with ticket, user ID and refund data', async () => {
      const ticketId = '66c1234567890abcdef0456';
      const userId = '66u00000000000000000001';
      const refundDto: RefundTicketDto = { reason: 'Need to cancel' };
      const mockResult = { success: true, message: 'Success' };

      (service.requestRefund as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.requestRefund(ticketId, refundDto, {
        user: { userId: userId },
      });

      expect(service.requestRefund).toHaveBeenCalledWith(
        ticketId,
        userId,
        refundDto,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('getRefundRequests', () => {
    it('should call service.getPendingRefundRequests with query', async () => {
      const mockQuery: RefundRequestQueryDto = { status: 'pending' };
      const mockResult = [];

      (service.getPendingRefundRequests as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await controller.getRefundRequests(mockQuery);

      expect(service.getPendingRefundRequests).toHaveBeenCalledWith(mockQuery);
      expect(result).toBe(mockResult);
    });
  });

  describe('reviewRefundRequest', () => {
    it('should call service.reviewRefundRequest with ticket, user ID and review data', async () => {
      const ticketId = '66c1234567890abcdef0456';
      const adminId = '66u00000000000000000001';
      const reviewDto: AdminReviewRefundDto = {
        approved: true,
        reviewNote: 'Approved',
      };
      const mockResult = { success: true, message: 'Approved' };

      (service.reviewRefundRequest as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.reviewRefundRequest(ticketId, reviewDto, {
        user: { userId: adminId },
      });

      expect(service.reviewRefundRequest).toHaveBeenCalledWith(
        ticketId,
        adminId,
        reviewDto,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('generateQRCode', () => {
    it('should call service.generateQRCode with ticket and user ID, optional timestamp', async () => {
      const ticketId = '66c1234567890abcdef0456';
      const userId = '66u00000000000000000001';
      const timestamp = '1724155200000';
      const mockResult = { qrCode: 'data:image/png;base64,...', data: {} };

      (service.generateQRCode as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.generateQRCode(
        ticketId,
        { user: { userId: userId } },
        timestamp,
      );

      expect(service.generateQRCode).toHaveBeenCalledWith(
        ticketId,
        userId,
        1724155200000,
      );
      expect(result).toBe(mockResult);
    });

    it('should call service.generateQRCode without timestamp when not provided', async () => {
      const ticketId = '66c1234567890abcdef0456';
      const userId = '66u0000000000000000001';
      const mockResult = { qrCode: 'data:image/png;base64,...', data: {} };

      (service.generateQRCode as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.generateQRCode(
        ticketId,
        { user: { userId: userId } },
        undefined,
      );

      expect(service.generateQRCode).toHaveBeenCalledWith(
        ticketId,
        userId,
        undefined,
      );
      expect(result).toBe(mockResult);
    });
  });
});

describe('VerifyController', () => {
  let controller: VerifyController;
  let service: TicketsService;

  const mockTicket = {
    _id: '66c1234567890abcdef0456',
    concert: {
      _id: '66c1234567890abcdef0456',
      name: '演唱会名称',
      date: new Date(),
      venue: 'venue',
    },
    user: {
      _id: '66u000000000000000000001',
      username: '用户名',
      email: 'user@example.com',
    },
    type: 'adult',
    price: 100,
    status: 'valid',
    signature: 'signature123',
    publicKey: 'publicKey123',
    qrCodeData: 'qrCodeData123',
    realName: '张三',
    idCard: '123456789012345678',
    faceImage: '/assets/face/test.jpg',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
  } as Ticket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            createOrder: jest.fn(),
            findMyTickets: jest.fn(),
            findOne: jest.fn(),
            requestRefund: jest.fn(),
            getPendingRefundRequests: jest.fn(),
            reviewRefundRequest: jest.fn(),
            generateQRCode: jest.fn(),
            verifyTicket: jest.fn(),
            confirmVerification: jest.fn(),
            getVerificationHistory: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VerifyController>(VerifyController);
    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('verifyTicket', () => {
    it('should call service.verifyTicket with provided data', async () => {
      const verifyDto: VerifyTicketDto = {
        qrData: 'qr-data',
        location: 'Entrance A',
      };
      const userId = '66u000000000000000000001';
      const mockResult = {
        valid: true,
        ticket: mockTicket,
        verifiedAt: new Date(),
        requiresManualVerification: false,
      };

      (service.verifyTicket as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.verifyTicket(verifyDto, {
        user: { userId: userId },
      });

      expect(service.verifyTicket).toHaveBeenCalledWith(verifyDto, userId);
      expect(result).toBe(mockResult);
    });
  });

  describe('getVerificationHistory', () => {
    it('should call service.getVerificationHistory with query', async () => {
      const mockQuery: VerificationHistoryQueryDto = {
        concertId: '66c1234567890abcdef0456',
      };
      const mockResult = [];

      (service.getVerificationHistory as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await controller.getVerificationHistory(mockQuery);

      expect(service.getVerificationHistory).toHaveBeenCalledWith(mockQuery);
      expect(result).toBe(mockResult);
    });
  });

  describe('confirmVerification', () => {
    it('should call service.confirmVerification with provided ticket and user IDs', async () => {
      const mockConfirmDto: ConfirmVerificationDto = {
        ticketId: 'ticket123',
      };
      const mockUserId = '66u00000000000000000001';
      const mockResult = { success: true, message: 'Confirmed' };

      (service.confirmVerification as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.confirmVerification(mockConfirmDto, {
        user: { userId: mockUserId },
      });

      expect(service.confirmVerification).toHaveBeenCalledWith(
        'ticket123',
        mockUserId,
      );
      expect(result).toBe(mockResult);
    });
  });
});
