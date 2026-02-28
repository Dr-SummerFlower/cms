import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFeedbackDto } from '../../../src/feedback/dto/create-feedback.dto';
import { FeedbackListResponseDto } from '../../../src/feedback/dto/feedback-list-response.dto';
import { FeedbackQueryDto } from '../../../src/feedback/dto/feedback-query.dto';
import { Feedback } from '../../../src/feedback/entities/feedback.entity';

describe('FeedbackDtos', () => {
  describe('CreateFeedbackDto', () => {
    it('当数据合法时，应通过校验', async () => {
      const dto = plainToInstance(CreateFeedbackDto, {
        timestamp: '2025-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Something went wrong',
        stack: 'stack',
        routeStatus: 500,
        routeStatusText: 'Internal Server Error',
        routeData: '{}',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('当必填字段缺失时，应校验失败', async () => {
      const dto = plainToInstance(CreateFeedbackDto, {
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Something went wrong',
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'timestamp');
      expect(error).toBeDefined();
    });

    it('当路由状态码不是数字时，应校验失败', async () => {
      const dto = plainToInstance(CreateFeedbackDto, {
        timestamp: '2025-01-01T00:00:00Z',
        userAgent: 'Mozilla/5.0',
        url: 'http://example.com',
        errorType: 'TypeError',
        message: 'Something went wrong',
        routeStatus: 'invalid',
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'routeStatus');
      expect(error).toBeDefined();
    });
  });

  describe('FeedbackQueryDto', () => {
    it('当没有传入参数时，应使用默认值', async () => {
      const dto = plainToInstance(FeedbackQueryDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('当分页参数无法解析时，应回退到默认值', async () => {
      const dto = plainToInstance(FeedbackQueryDto, {
        page: 'abc',
        limit: 'def',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('当分页参数小于 1 时，应校验失败', async () => {
      const dto = plainToInstance(FeedbackQueryDto, {
        page: 0,
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'page');
      expect(error).toBeDefined();
    });
  });

  describe('FeedbackListResponseDto', () => {
    it('当赋值数据时，应保持一致', () => {
      const dto = new FeedbackListResponseDto();
      const feedback = { _id: '1' } as unknown as Feedback;

      dto.data = [feedback];
      dto.total = 1;
      dto.page = 1;
      dto.limit = 10;
      dto.totalPages = 1;

      expect(dto.data).toEqual([feedback]);
      expect(dto.total).toBe(1);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.totalPages).toBe(1);
    });
  });
});
