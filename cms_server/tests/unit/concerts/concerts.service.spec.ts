/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { ConcertsService } from '../../../src/concerts/concerts.service';
import { ConcertQueryDto } from '../../../src/concerts/dto/concert-query.dto';
import { CreateConcertDto } from '../../../src/concerts/dto/create-concert.dto';
import { UpdateConcertDto } from '../../../src/concerts/dto/update-concert.dto';
import { Concert } from '../../../src/concerts/entities/concert.entity';
import { EcdsaService } from '../../../src/ecdsa/ecdsa.service';
import { Ticket } from '../../../src/tickets/entities/ticket.entity';
import { ConcertsReminder } from '../../../src/types';

const createConcertDto = (
  overrides: Partial<CreateConcertDto> = {},
): CreateConcertDto => ({
  name: '周杰伦2025世界巡回演唱会-北京站',
  date: new Date('2025-09-01T19:30:00.000Z'),
  venue: '北京国家体育场（鸟巢）',
  adultPrice: 680,
  childPrice: 380,
  totalTickets: 5000,
  maxAdultTicketsPerUser: 2,
  maxChildTicketsPerUser: 1,
  description: '本次巡演将带来全新曲目与经典回顾',
  ...overrides,
});

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
    privateKey: 'privateKey',
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
    ...overrides,
  }) as Concert;

const createExecQuery = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

const createFindQuery = <T>(value: T) => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

const createRejectedExecQuery = (error: unknown) => ({
  exec: jest.fn().mockRejectedValue(error),
});

const createTicketFindQuery = <T>(value: T) => ({
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
});

const validConcertId = '507f1f77bcf86cd799439011';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let concertModel: jest.Mocked<Model<Concert>>;
  let ticketModel: jest.Mocked<Model<Ticket>>;
  let ecdsaService: EcdsaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsService,
        {
          provide: getModelToken(Concert.name),
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            countDocuments: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            updateMany: jest.fn(),
          },
        },
        {
          provide: getModelToken(Ticket.name),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: EcdsaService,
          useValue: {
            generateKeyPair: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConcertsService>(ConcertsService);
    concertModel = module.get(getModelToken(Concert.name));
    ticketModel = module.get(getModelToken(Ticket.name));
    ecdsaService = module.get<EcdsaService>(EcdsaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('应定义服务实例', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('当创建成功时，应返回创建后的演唱会', async () => {
      const dto = createConcertDto();
      const poster = 'http://localhost:9000/assets/poster/test.png';
      const keyPair = { publicKey: 'publicKey', privateKey: 'privateKey' };
      const savedConcert = createConcertEntity();

      (ecdsaService.generateKeyPair as jest.Mock).mockReturnValue(keyPair);
      (concertModel.create as jest.Mock).mockResolvedValue(savedConcert as any);
      concertModel.findById.mockReturnValue(
        createExecQuery(savedConcert) as any,
      );

      const result = await service.create(dto, poster);

      expect(concertModel.create).toHaveBeenCalledWith({
        ...dto,
        poster,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
      });
      expect(concertModel.findById).toHaveBeenCalledWith(savedConcert._id);
      expect(result).toBe(savedConcert);
    });

    it('当创建后未找到演唱会时，应抛出异常', async () => {
      const dto = createConcertDto();
      const poster = 'http://localhost:9000/assets/poster/test.png';
      const savedConcert = createConcertEntity();

      (ecdsaService.generateKeyPair as jest.Mock).mockReturnValue({
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      });
      (concertModel.create as jest.Mock).mockResolvedValue(savedConcert as any);
      concertModel.findById.mockReturnValue(createExecQuery(null) as any);

      await expect(service.create(dto, poster)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.create(dto, poster)).rejects.toThrow(
        '演唱会创建失败',
      );
    });

    it('当数据验证失败时，应抛出异常', async () => {
      const dto = createConcertDto();
      const poster = 'http://localhost:9000/assets/poster/test.png';

      (ecdsaService.generateKeyPair as jest.Mock).mockReturnValue({
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      });
      concertModel.create.mockRejectedValue(
        Object.assign(new Error('ValidationError'), {
          name: 'ValidationError',
        }),
      );

      await expect(service.create(dto, poster)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, poster)).rejects.toThrow(
        '演唱会数据验证失败',
      );
    });

    it('当演唱会名称已存在时，应抛出异常', async () => {
      const dto = createConcertDto();
      const poster = 'http://localhost:9000/assets/poster/test.png';

      (ecdsaService.generateKeyPair as jest.Mock).mockReturnValue({
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      });
      concertModel.create.mockRejectedValue(
        Object.assign(new Error('DuplicateKey'), { code: 11000 }),
      );

      await expect(service.create(dto, poster)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, poster)).rejects.toThrow(
        '演唱会名称已存在',
      );
    });
  });

  describe('findAll', () => {
    it('当分页参数无效时，应抛出异常', async () => {
      const query: ConcertQueryDto = { page: 0, limit: 10 };

      await expect(service.findAll(query)).rejects.toThrow(BadRequestException);
      await expect(service.findAll(query)).rejects.toThrow(
        '页码和每页数量必须为正数，且每页数量不能超过100',
      );
    });

    it('当查询成功时，应返回分页结果', async () => {
      const query: ConcertQueryDto = {
        status: 'upcoming',
        search: '周杰伦',
        page: 2,
        limit: 5,
      };
      const concerts = [createConcertEntity({ name: '测试演唱会' })];
      const total = 12;

      concertModel.find.mockReturnValue(createFindQuery(concerts) as any);
      concertModel.countDocuments.mockReturnValue(
        createExecQuery(total) as any,
      );

      const result = await service.findAll(query);

      expect(concertModel.find).toHaveBeenCalledWith({
        status: 'upcoming',
        name: { $regex: '周杰伦', $options: 'i' },
      });
      expect(concertModel.countDocuments).toHaveBeenCalledWith({
        status: 'upcoming',
        name: { $regex: '周杰伦', $options: 'i' },
      });
      expect(result).toEqual({
        concerts,
        total,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('当演唱会ID无效时，应抛出异常', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        '无效的演唱会ID格式',
      );
    });

    it('当演唱会不存在时，应抛出异常', async () => {
      concertModel.findById.mockReturnValue(createExecQuery(null) as any);

      await expect(service.findOne(validConcertId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(validConcertId)).rejects.toThrow(
        '演唱会不存在',
      );
    });

    it('当演唱会存在时，应返回演唱会详情', async () => {
      const concert = createConcertEntity();

      concertModel.findById.mockReturnValue(createExecQuery(concert) as any);

      const result = await service.findOne(validConcertId);

      expect(result).toBe(concert);
    });
  });

  describe('update', () => {
    it('当演唱会ID无效时，应抛出异常', async () => {
      await expect(service.update('invalid', {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('invalid', {})).rejects.toThrow(
        '无效的演唱会ID格式',
      );
    });

    it('当演唱会不存在时，应抛出异常', async () => {
      const updateDto: UpdateConcertDto = { venue: '新场馆' };

      concertModel.findByIdAndUpdate.mockReturnValue(
        createExecQuery(null) as any,
      );

      await expect(service.update(validConcertId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(validConcertId, updateDto)).rejects.toThrow(
        '演唱会不存在',
      );
    });

    it('当更新后未找到演唱会时，应抛出异常', async () => {
      const updateDto: UpdateConcertDto = { venue: '新场馆' };
      const updatedConcert = createConcertEntity({ venue: '新场馆' });

      concertModel.findByIdAndUpdate.mockReturnValue(
        createExecQuery(updatedConcert) as any,
      );
      concertModel.findById.mockReturnValue(createExecQuery(null) as any);

      await expect(service.update(validConcertId, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.update(validConcertId, updateDto)).rejects.toThrow(
        '更新的演唱会未找到',
      );
    });

    it('当更新成功时，应返回更新后的演唱会', async () => {
      const updateDto: UpdateConcertDto = { venue: '新场馆' };
      const updatedConcert = createConcertEntity({ venue: '新场馆' });

      concertModel.findByIdAndUpdate.mockReturnValue(
        createExecQuery(updatedConcert) as any,
      );
      concertModel.findById.mockReturnValue(
        createExecQuery(updatedConcert) as any,
      );

      const result = await service.update(validConcertId, updateDto);

      expect(concertModel.findByIdAndUpdate).toHaveBeenCalledWith(
        validConcertId,
        updateDto,
        { new: true },
      );
      expect(concertModel.findById).toHaveBeenCalledWith(updatedConcert._id);
      expect(result).toBe(updatedConcert);
    });

    it('当数据验证失败时，应抛出异常', async () => {
      concertModel.findByIdAndUpdate.mockReturnValue(
        createRejectedExecQuery(
          Object.assign(new Error('ValidationError'), {
            name: 'ValidationError',
          }),
        ) as any,
      );

      await expect(
        service.update(validConcertId, { venue: '新场馆' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(validConcertId, { venue: '新场馆' }),
      ).rejects.toThrow('演唱会数据验证失败');
    });

    it('当演唱会名称已存在时，应抛出异常', async () => {
      concertModel.findByIdAndUpdate.mockReturnValue(
        createRejectedExecQuery(
          Object.assign(new Error('DuplicateKey'), { code: 11000 }),
        ) as any,
      );

      await expect(
        service.update(validConcertId, { name: '重复名称' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(validConcertId, { name: '重复名称' }),
      ).rejects.toThrow('演唱会名称已存在');
    });
  });

  describe('remove', () => {
    it('当演唱会ID无效时，应抛出异常', async () => {
      await expect(service.remove('invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.remove('invalid')).rejects.toThrow(
        '无效的演唱会ID格式',
      );
    });

    it('当演唱会不存在时，应抛出异常', async () => {
      concertModel.findByIdAndDelete.mockReturnValue(
        createExecQuery(null) as any,
      );

      await expect(service.remove(validConcertId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(validConcertId)).rejects.toThrow(
        '演唱会不存在',
      );
    });

    it('当删除成功时，应返回空值', async () => {
      concertModel.findByIdAndDelete.mockReturnValue(
        createExecQuery(createConcertEntity()) as any,
      );

      const result = await service.remove(validConcertId);

      expect(result).toBeNull();
    });
  });

  describe('updateConcertStatuses', () => {
    it('当更新成功时，应调用两次状态更新', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      concertModel.updateMany
        .mockReturnValueOnce(createExecQuery(undefined) as any)
        .mockReturnValueOnce(createExecQuery(undefined) as any);

      await service.updateConcertStatuses();

      expect(concertModel.updateMany).toHaveBeenNthCalledWith(
        1,
        {
          date: { $lte: expect.any(Date), $gt: expect.any(Date) },
          status: 'upcoming',
        },
        { $set: { status: 'ongoing' } },
      );
      expect(concertModel.updateMany).toHaveBeenNthCalledWith(
        2,
        {
          date: { $lte: expect.any(Date) },
          status: { $in: ['upcoming', 'ongoing'] },
        },
        { $set: { status: 'completed' } },
      );
      expect(logSpy).toHaveBeenCalledWith('演唱会状态更新完成');
    });

    it('当更新失败时，应抛出异常', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();

      concertModel.updateMany.mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(new Error('fail')),
      } as any);

      await expect(service.updateConcertStatuses()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('getConcertsForReminder', () => {
    it('当没有需要提醒的演唱会时，应返回空数组', async () => {
      concertModel.find.mockReturnValue(createExecQuery([]) as any);

      const result = await service.getConcertsForReminder();

      expect(result).toEqual([]);
    });

    it('当存在需要提醒的演唱会时，应返回去重后的邮箱列表', async () => {
      const concertPlain = createConcertEntity();
      const concert = {
        ...concertPlain,
        toObject: jest.fn().mockReturnValue(concertPlain),
      } as unknown as Concert;
      const tickets = [
        { user: { email: 'a@test.com' } },
        { user: { email: 'a@test.com' } },
        { user: { email: '' } },
      ] as Ticket[];

      concertModel.find.mockReturnValue(createExecQuery([concert]) as any);
      ticketModel.find.mockReturnValue(createTicketFindQuery(tickets) as any);

      const result: ConcertsReminder[] = await service.getConcertsForReminder();

      expect(result).toEqual([
        {
          concert: concertPlain,
          userEmails: ['a@test.com'],
        },
      ]);
    });

    it('当查询失败时，应抛出异常', async () => {
      concertModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('查询失败')),
      } as any);
      jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(service.getConcertsForReminder()).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.getConcertsForReminder()).rejects.toThrow(
        '获取需要提醒的演唱会失败: 查询失败',
      );
    });
  });

  describe('updatePoster', () => {
    it('当演唱会ID无效时，应抛出异常', async () => {
      await expect(service.updatePoster('invalid', 'url')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updatePoster('invalid', 'url')).rejects.toThrow(
        '无效的用户ID格式',
      );
    });

    it('当演唱会不存在时，应抛出异常', async () => {
      concertModel.findById.mockResolvedValue(null);

      await expect(service.updatePoster(validConcertId, 'url')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updatePoster(validConcertId, 'url')).rejects.toThrow(
        '演唱会不存在',
      );
    });

    it('当更新成功时，应返回更新后的演唱会', async () => {
      const concert = createConcertEntity({
        poster: 'old',
        save: jest.fn().mockResolvedValue(true),
      } as any);

      concertModel.findById.mockResolvedValue(concert);

      const result = await service.updatePoster(validConcertId, 'new');

      expect(concert.poster).toBe('new');
      expect(concert.save).toHaveBeenCalled();
      expect(result).toBe(concert);
    });
  });
});
