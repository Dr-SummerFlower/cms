import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeedbackDto } from '../../../src/feedback/dto/create-feedback.dto';
import { FeedbackQueryDto } from '../../../src/feedback/dto/feedback-query.dto';
import { Feedback } from '../../../src/feedback/entities/feedback.entity';
import { FeedbackService } from '../../../src/feedback/feedback.service';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockFeedbackModel: any;

  beforeEach(async () => {
    // 创建 Mongoose Model 的模拟对象
    const mockModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      sort: jest.fn(),
      skip: jest.fn(),
      limit: jest.fn(),
      exec: jest.fn(),
    };

    // 模拟构造函数
    const mockModelConstructor = jest.fn().mockImplementation((input) => {
      const result = { ...input };
      result.save = jest.fn().mockResolvedValue(result);
      return result;
    });

    Object.assign(mockModelConstructor, mockModel);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getModelToken(Feedback.name),
          useValue: mockModelConstructor,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);

    // 获取模型实例
    mockFeedbackModel = module.get(getModelToken(Feedback.name));

    jest.clearAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应创建新的反馈记录', async () => {
      // Arrange
      const createFeedbackDto: CreateFeedbackDto = {
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Something went wrong',
      };

      const expectedResult = {
        _id: 'some-id',
        ...createFeedbackDto,
      };

      const mockInstance = {
        ...expectedResult,
        save: jest.fn().mockResolvedValue(expectedResult),
      };
      mockFeedbackModel.mockImplementation(() => mockInstance);

      // Act
      const result = await service.create(createFeedbackDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockFeedbackModel).toHaveBeenCalledWith(createFeedbackDto);
      expect(mockInstance.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('应返回默认分页的反馈列表', async () => {
      // Arrange
      const query: FeedbackQueryDto = {};

      const mockFeedbackList = [
        {
          _id: '1',
          timestamp: '2023-01-01T00:00:00Z',
          userAgent: 'Mozilla/5.0',
          url: 'http://example.com',
          errorType: 'TypeError',
          message: 'Error 1',
          status: 'pending',
        },
      ];

      // 设置链式调用的模拟
      const execCount = jest.fn().mockResolvedValue(1); // 总数
      const execFind = jest.fn().mockResolvedValue(mockFeedbackList); // 查询结果

      const limitChain = {
        exec: execFind,
      };

      const skipChain = {
        limit: jest.fn().mockReturnThis(),
        exec: execFind,
      };

      const sortChain = {
        skip: jest.fn().mockReturnValue(skipChain),
        limit: jest.fn().mockReturnValue(limitChain),
        exec: execFind,
      };

      const findChain = {
        sort: jest.fn().mockReturnValue(sortChain),
        skip: jest.fn().mockReturnValue(skipChain),
        limit: jest.fn().mockReturnValue(limitChain),
        exec: execFind,
      };

      const countChain = {
        exec: execCount,
      };

      mockFeedbackModel.find.mockReturnValue(findChain);
      mockFeedbackModel.countDocuments.mockReturnValue(countChain);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual({
        data: mockFeedbackList,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(mockFeedbackModel.find).toHaveBeenCalledWith({});
      expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('应返回应用过滤器后的反馈列表', async () => {
      // Arrange
      const query: FeedbackQueryDto = {
        page: 1,
        limit: 5,
        status: 'pending',
        errorType: 'TypeError',
        search: 'error',
      };

      const mockResults = [];
      const mockCount = 0;

      const execCount = jest.fn().mockResolvedValue(mockCount);
      const execFind = jest.fn().mockResolvedValue(mockResults);

      const limitChain = {
        exec: execFind,
      };

      const skipChain = {
        limit: jest.fn().mockReturnThis(),
        exec: execFind,
      };

      const sortChain = {
        skip: jest.fn().mockReturnValue(skipChain),
        limit: jest.fn().mockReturnValue(limitChain),
        exec: execFind,
      };

      const findChain = {
        sort: jest.fn().mockReturnValue(sortChain),
        skip: jest.fn().mockReturnValue(skipChain),
        limit: jest.fn().mockReturnValue(limitChain),
        exec: execFind,
      };

      const countChain = {
        exec: execCount,
      };

      mockFeedbackModel.find.mockReturnValue(findChain);
      mockFeedbackModel.countDocuments.mockReturnValue(countChain);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(mockFeedbackModel.find).toHaveBeenCalledWith({
        status: 'pending',
        errorType: 'TypeError',
        $or: [
          { message: { $regex: 'error', $options: 'i' } },
          { url: { $regex: 'error', $options: 'i' } },
          { userAgent: { $regex: 'error', $options: 'i' } },
        ],
      });
    });
  });

  describe('findById', () => {
    it('应返回 ID 对应的反馈对象', async () => {
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

      const execFn = jest.fn().mockResolvedValue(expectedFeedback);
      const findByIdChain = {
        exec: execFn,
      };

      mockFeedbackModel.findById.mockReturnValue(findByIdChain);

      // Act
      const result = await service.findById(feedbackId);

      // Assert
      expect(result).toEqual(expectedFeedback);
      expect(mockFeedbackModel.findById).toHaveBeenCalledWith(feedbackId);
    });

    it('当反馈 ID 不存在时，应返回 null', async () => {
      // Arrange
      const feedbackId = 'nonexistent-id';

      const execFn = jest.fn().mockResolvedValue(null);
      const findByIdChain = {
        exec: execFn,
      };

      mockFeedbackModel.findById.mockReturnValue(findByIdChain);

      // Act
      const result = await service.findById(feedbackId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('应更新并返回反馈状态', async () => {
      // Arrange
      const feedbackId = 'some-id';
      const newStatus = 'resolved';
      const updatedFeedback = {
        _id: feedbackId,
        status: newStatus,
        timestamp: '2023-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Error message',
      };

      const execFn = jest.fn().mockResolvedValue(updatedFeedback);
      const findByIdAndUpdateChain = {
        exec: execFn,
      };

      mockFeedbackModel.findByIdAndUpdate.mockReturnValue(
        findByIdAndUpdateChain,
      );

      // Act
      const result = await service.updateStatus(feedbackId, newStatus);

      // Assert
      expect(result).toEqual(updatedFeedback);
      expect(mockFeedbackModel.findByIdAndUpdate).toHaveBeenCalledWith(
        feedbackId,
        { status: newStatus },
        { new: true },
      );
    });

    it('当尝试更新不存在的反馈时，应返回 null', async () => {
      // Arrange
      const feedbackId = 'nonexistent-id';
      const newStatus = 'resolved';

      const execFn = jest.fn().mockResolvedValue(null);
      const findByIdAndUpdateChain = {
        exec: execFn,
      };

      mockFeedbackModel.findByIdAndUpdate.mockReturnValue(
        findByIdAndUpdateChain,
      );

      // Act
      const result = await service.updateStatus(feedbackId, newStatus);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('应删除指定 ID 的反馈', async () => {
      // Arrange
      const feedbackId = 'some-id';

      const execFn = jest.fn().mockResolvedValue(undefined);
      const findByIdAndDeleteChain = {
        exec: execFn,
      };

      mockFeedbackModel.findByIdAndDelete.mockReturnValue(
        findByIdAndDeleteChain,
      );

      // Act
      await service.delete(feedbackId);

      // Assert
      expect(mockFeedbackModel.findByIdAndDelete).toHaveBeenCalledWith(
        feedbackId,
      );
    });
  });
});
