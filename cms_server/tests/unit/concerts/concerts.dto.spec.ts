import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConcertListResponseDto } from '../../../src/concerts/dto/concert-list-response.dto';
import { ConcertQueryDto } from '../../../src/concerts/dto/concert-query.dto';
import { CreateConcertDto } from '../../../src/concerts/dto/create-concert.dto';
import { UpdateConcertDto } from '../../../src/concerts/dto/update-concert.dto';
import { Concert } from '../../../src/concerts/entities/concert.entity';

describe('ConcertDtos', () => {
  describe('CreateConcertDto', () => {
    it('当数据合法时，应通过校验', async () => {
      const dto = plainToInstance(CreateConcertDto, {
        name: '周杰伦2025世界巡回演唱会-北京站',
        date: '2025-09-01T19:30:00.000Z',
        venue: '北京国家体育场（鸟巢）',
        adultPrice: '680',
        childPrice: '380',
        totalTickets: '5000',
        maxAdultTicketsPerUser: '2',
        maxChildTicketsPerUser: '1',
        description: '本次巡演将带来全新曲目与经典回顾',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.adultPrice).toBe(680);
      expect(dto.childPrice).toBe(380);
      expect(dto.totalTickets).toBe(5000);
      expect(dto.maxAdultTicketsPerUser).toBe(2);
      expect(dto.maxChildTicketsPerUser).toBe(1);
    });

    it('当演唱会名称为空时，应校验失败', async () => {
      const dto = plainToInstance(CreateConcertDto, {
        name: '',
        date: '2025-09-01T19:30:00.000Z',
        venue: '北京国家体育场（鸟巢）',
        adultPrice: 680,
        childPrice: 380,
        totalTickets: 5000,
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('当价格为负数时，应校验失败', async () => {
      const dto = plainToInstance(CreateConcertDto, {
        name: '演唱会',
        date: '2025-09-01T19:30:00.000Z',
        venue: '北京国家体育场（鸟巢）',
        adultPrice: -1,
        childPrice: 380,
        totalTickets: 5000,
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'adultPrice');
      expect(error).toBeDefined();
    });

    it('当购买限制为空字符串时，应转换为 undefined', async () => {
      const dto = plainToInstance(CreateConcertDto, {
        name: '演唱会',
        date: '2025-09-01T19:30:00.000Z',
        venue: '北京国家体育场（鸟巢）',
        adultPrice: 680,
        childPrice: 380,
        totalTickets: 5000,
        maxAdultTicketsPerUser: '',
        maxChildTicketsPerUser: '',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.maxAdultTicketsPerUser).toBeUndefined();
      expect(dto.maxChildTicketsPerUser).toBeUndefined();
    });
  });

  describe('UpdateConcertDto', () => {
    it('当为空对象时，应通过校验', async () => {
      const dto = plainToInstance(UpdateConcertDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('当票价为负数时，应校验失败', async () => {
      const dto = plainToInstance(UpdateConcertDto, {
        adultPrice: -1,
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'adultPrice');
      expect(error).toBeDefined();
    });
  });

  describe('ConcertQueryDto', () => {
    it('当没有传入参数时，应使用默认值', async () => {
      const dto = plainToInstance(ConcertQueryDto, {});

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('当分页参数无法解析时，应回退到默认值', async () => {
      const dto = plainToInstance(ConcertQueryDto, {
        page: 'abc',
        limit: 'def',
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('当状态不合法时，应校验失败', async () => {
      const dto = plainToInstance(ConcertQueryDto, {
        status: 'invalid',
      });

      const errors = await validate(dto);

      const error = errors.find((item) => item.property === 'status');
      expect(error).toBeDefined();
    });
  });

  describe('ConcertListResponseDto', () => {
    it('当赋值数据时，应保持一致', () => {
      const dto = new ConcertListResponseDto();
      const concert = { _id: '1' } as unknown as Concert;

      dto.concerts = [concert];
      dto.total = 1;
      dto.page = 1;
      dto.limit = 10;
      dto.totalPages = 1;

      expect(dto.concerts).toEqual([concert]);
      expect(dto.total).toBe(1);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.totalPages).toBe(1);
    });
  });
});
