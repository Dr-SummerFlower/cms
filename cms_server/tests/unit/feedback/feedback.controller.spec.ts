import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeedbackDto } from '../../../src/feedback/dto/create-feedback.dto';
import { FeedbackQueryDto } from '../../../src/feedback/dto/feedback-query.dto';
import { FeedbackController } from '../../../src/feedback/feedback.controller';
import { FeedbackService } from '../../../src/feedback/feedback.service';

// Mock service
const mockFeedbackService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let service: typeof mockFeedbackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    service = module.get<typeof mockFeedbackService>(FeedbackService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a feedback and return success response', async () => {
      // Arrange
      const createFeedbackDto: CreateFeedbackDto = {
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Something went wrong',
      };

      const expectedResult = {
        ok: true,
        data: { ...createFeedbackDto, _id: 'some-id' },
      };

      mockFeedbackService.create.mockResolvedValue(expectedResult.data);

      // Act
      const result = await controller.create(createFeedbackDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockFeedbackService.create).toHaveBeenCalledWith(
        createFeedbackDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated feedback list', async () => {
      // Arrange
      const query: FeedbackQueryDto = {};

      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockFeedbackService.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.findAll(query);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockFeedbackService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a feedback when found', async () => {
      // Arrange
      const feedbackId = 'some-id';
      const expectedFeedback = {
        _id: feedbackId,
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Error message',
      };

      mockFeedbackService.findById.mockResolvedValue(expectedFeedback);

      // Act
      const result = await controller.findOne(feedbackId);

      // Assert
      expect(result).toEqual(expectedFeedback);
      expect(mockFeedbackService.findById).toHaveBeenCalledWith(feedbackId);
    });

    it('should throw NotFoundException when feedback not found', async () => {
      // Arrange
      const feedbackId = 'nonexistent-id';

      mockFeedbackService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.findOne(feedbackId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(feedbackId)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`,
      );
      expect(mockFeedbackService.findById).toHaveBeenCalledWith(feedbackId);
    });
  });

  describe('updateStatus', () => {
    it('should update and return feedback status', async () => {
      // Arrange
      const feedbackId = 'some-id';
      const status = 'resolved';
      const updatedFeedback = {
        _id: feedbackId,
        status,
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Error message',
      };

      mockFeedbackService.updateStatus.mockResolvedValue(updatedFeedback);

      // Act
      const result = await controller.updateStatus(feedbackId, status);

      // Assert
      expect(result).toEqual(updatedFeedback);
      expect(mockFeedbackService.updateStatus).toHaveBeenCalledWith(
        feedbackId,
        status,
      );
    });

    it('should throw NotFoundException when feedback not found during update', async () => {
      // Arrange
      const feedbackId = 'nonexistent-id';
      const status = 'resolved';

      mockFeedbackService.updateStatus.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.updateStatus(feedbackId, status)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.updateStatus(feedbackId, status)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`,
      );
      expect(mockFeedbackService.updateStatus).toHaveBeenCalledWith(
        feedbackId,
        status,
      );
    });
  });

  describe('remove', () => {
    it('should delete feedback and return success response', async () => {
      // Arrange
      const feedbackId = 'some-id';

      // Service delete method returns void
      mockFeedbackService.delete.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(feedbackId);

      // Assert
      expect(result).toEqual({ ok: true });
      expect(mockFeedbackService.delete).toHaveBeenCalledWith(feedbackId);
    });
  });
});
