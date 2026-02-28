/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConcertsController } from '../../../src/concerts/concerts.controller';
import { ConcertsService } from '../../../src/concerts/concerts.service';
import { ConcertQueryDto } from '../../../src/concerts/dto/concert-query.dto';
import { CreateConcertDto } from '../../../src/concerts/dto/create-concert.dto';
import { UpdateConcertDto } from '../../../src/concerts/dto/update-concert.dto';
import { Concert } from '../../../src/concerts/entities/concert.entity';
import { StoragesService } from '../../../src/storages/storages.service';

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
    createdAt: new Date('2025-08-20T12:00:00.000Z'),
    updatedAt: new Date('2025-08-20T12:00:00.000Z'),
    ...overrides,
  }) as Concert;

describe('ConcertsController', () => {
  let controller: ConcertsController;
  let concertsService: ConcertsService;
  let storagesService: StoragesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertsController],
      providers: [
        {
          provide: ConcertsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            updatePoster: jest.fn(),
          },
        },
        {
          provide: StoragesService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConcertsController>(ConcertsController);
    concertsService = module.get<ConcertsService>(ConcertsService);
    storagesService = module.get<StoragesService>(StoragesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应定义控制器实例', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('当创建成功时，应返回演唱会数据', async () => {
      const dto = createConcertDto();
      const poster = { originalname: 'poster.png' } as Express.Multer.File;
      const concert = createConcertEntity();

      (storagesService.uploadFile as jest.Mock).mockResolvedValue(
        concert.poster,
      );
      (concertsService.create as jest.Mock).mockResolvedValue(concert);

      const result = await controller.create(dto, poster);

      expect(storagesService.uploadFile).toHaveBeenCalledWith(poster, 'poster');
      expect(concertsService.create).toHaveBeenCalledWith(dto, concert.poster);
      expect(result).toBe(concert);
    });
  });

  describe('findAll', () => {
    it('当查询成功时，应返回列表结果', async () => {
      const query: ConcertQueryDto = {
        status: 'upcoming',
        search: '周杰伦',
        page: 1,
        limit: 10,
      };
      const response = {
        concerts: [createConcertEntity()],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      (concertsService.findAll as jest.Mock).mockResolvedValue(response);

      const result = await controller.findAll(query);

      expect(concertsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(response);
    });
  });

  describe('findOne', () => {
    it('当查询成功时，应返回演唱会详情', async () => {
      const concertId = '66c1234567890abcdef0456';
      const concert = createConcertEntity({ _id: concertId } as any);

      (concertsService.findOne as jest.Mock).mockResolvedValue(concert);

      const result = await controller.findOne(concertId);

      expect(concertsService.findOne).toHaveBeenCalledWith(concertId);
      expect(result).toBe(concert);
    });
  });

  describe('update', () => {
    it('当更新成功时，应返回更新后的演唱会', async () => {
      const concertId = '66c1234567890abcdef0456';
      const updateDto: UpdateConcertDto = { venue: '新场馆' };
      const concert = createConcertEntity({
        _id: concertId,
        venue: '新场馆',
      } as any);

      (concertsService.update as jest.Mock).mockResolvedValue(concert);

      const result = await controller.update(concertId, updateDto);

      expect(concertsService.update).toHaveBeenCalledWith(concertId, updateDto);
      expect(result).toBe(concert);
    });
  });

  describe('remove', () => {
    it('当删除成功时，应返回空值', async () => {
      (concertsService.remove as jest.Mock).mockResolvedValue(null);

      const result = await controller.remove('66c1234567890abcdef0456');

      expect(concertsService.remove).toHaveBeenCalledWith(
        '66c1234567890abcdef0456',
      );
      expect(result).toBeNull();
    });
  });

  describe('uploadPoster', () => {
    it('当非管理员更新海报时，应抛出异常', async () => {
      const poster = { originalname: 'poster.png' } as Express.Multer.File;

      await expect(
        controller.uploadPoster('66c1234567890abcdef0456', poster, {
          user: { userId: 'user', role: 'USER' },
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.uploadPoster('66c1234567890abcdef0456', poster, {
          user: { userId: 'user', role: 'USER' },
        }),
      ).rejects.toThrow('无权修改演唱会海报');
    });

    it('当缺少海报文件时，应抛出异常', async () => {
      await expect(
        controller.uploadPoster(
          '66c1234567890abcdef0456',
          undefined as unknown as Express.Multer.File,
          {
            user: { userId: 'admin', role: 'ADMIN' },
          },
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadPoster(
          '66c1234567890abcdef0456',
          undefined as unknown as Express.Multer.File,
          {
            user: { userId: 'admin', role: 'ADMIN' },
          },
        ),
      ).rejects.toThrow('缺少文件');
    });

    it('当上传成功时，应返回更新后的演唱会', async () => {
      const poster = { originalname: 'poster.png' } as Express.Multer.File;
      const concertId = '66c1234567890abcdef0456';
      const concert = createConcertEntity({ _id: concertId } as any);

      (storagesService.uploadFile as jest.Mock).mockResolvedValue(
        concert.poster,
      );
      (concertsService.updatePoster as jest.Mock).mockResolvedValue(concert);

      const result = await controller.uploadPoster(concertId, poster, {
        user: { userId: 'admin', role: 'ADMIN' },
      });

      expect(storagesService.uploadFile).toHaveBeenCalledWith(poster, 'poster');
      expect(concertsService.updatePoster).toHaveBeenCalledWith(
        concertId,
        concert.poster,
      );
      expect(result).toBe(concert);
    });
  });
});
