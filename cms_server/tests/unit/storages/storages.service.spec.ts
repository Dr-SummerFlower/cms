import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as Minio from 'minio';
import { StoragesService } from '../../../src/storages/storages.service';

const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  setBucketPolicy: jest.fn(),
  putObject: jest.fn(),
};

type MockFile = {
  buffer: Buffer;
  originalname: string;
  mimetype?: string;
  fieldname?: string;
  encoding?: string;
  size?: number;
};

describe('StoragesService', () => {
  let service: StoragesService;
  let configService: ConfigService;

  beforeEach(async () => {
    configService = new ConfigService();

    jest
      .spyOn(Minio, 'Client')
      .mockImplementation(() => mockMinioClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoragesService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<StoragesService>(StoragesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('应成功上传文件', async () => {
      const validFile: MockFile = {
        buffer: Buffer.from('test image data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      };

      const folder = 'avatar';

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadFile(
        validFile as Express.Multer.File,
        folder,
      );

      expect(mockMinioClient.putObject).toHaveBeenCalled();
      expect(typeof result).toBe('string');
      expect(result).toContain('/assets/avatar/');
    });

    it('当文件无效时，应抛出 InternalServerErrorException', async () => {
      const invalidFile = null;

      await expect(
        service.uploadFile(invalidFile as any, 'avatar'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('当文件 buffer 为 null 时，应抛出 InternalServerErrorException', async () => {
      const invalidFile: MockFile = {
        buffer: null as any,
        originalname: 'test.jpg',
      };

      await expect(
        service.uploadFile(invalidFile as Express.Multer.File, 'avatar'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('当 buffer 为空但存在时，不应抛出错误', async () => {
      const validFile: MockFile = {
        buffer: Buffer.alloc(0),
        originalname: 'test.jpg',
      };

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFile(validFile as Express.Multer.File, 'avatar'),
      ).resolves.toBeDefined();
    });

    it('应正确处理没有扩展名的文件', async () => {
      const fileWithoutExt: MockFile = {
        buffer: Buffer.from('test data'),
        originalname: 'test_file',
      };
      const folder = 'poster';

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadFile(
        fileWithoutExt as Express.Multer.File,
        folder,
      );

      expect(mockMinioClient.putObject).toHaveBeenCalled();
      expect(result).toContain('/assets/poster/');
    });

    it('应正确处理有扩展名的文件', async () => {
      const file: MockFile = {
        buffer: Buffer.from('test data'),
        originalname: 'test.png',
      };
      const folder = 'face';

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadFile(
        file as Express.Multer.File,
        folder,
      );

      const callArgs = mockMinioClient.putObject.mock.calls[0];
      const objectName = callArgs[1];

      expect(objectName).toMatch(/^face\/\d{4}-\d{2}-\d{2}\//);
      expect(objectName).toMatch(/\.png$/);
    });
  });

  describe('uploadBuffer', () => {
    it('应成功上传 buffer', async () => {
      const buffer = Buffer.from('test data');
      const filename = 'test.txt';
      const mimetype = 'text/plain';
      const folder = 'avatars';

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadBuffer(
        buffer,
        filename,
        mimetype,
        folder,
      );

      expect(mockMinioClient.putObject).toHaveBeenCalled();
      expect(result).toContain('/assets/avatars/');
    });

    it('当 buffer 为空时，应抛出 InternalServerErrorException', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const filename = 'test.txt';

      await expect(
        service.uploadBuffer(emptyBuffer, filename, 'text/plain', 'avatars'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('应正确处理自定义扩展名的文件', async () => {
      const buffer = Buffer.from('test data');
      const filename = 'test.custom';
      const mimetype = 'application/custom';
      const folder = 'posters';

      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadBuffer(
        buffer,
        filename,
        mimetype,
        folder,
      );

      const callArgs = mockMinioClient.putObject.mock.calls[0];
      const objectName = callArgs[1];

      expect(objectName).toMatch(/^posters\/\d{4}-\d{2}-\d{2}\//);
      expect(objectName).toMatch(/\.custom$/);
    });
  });

  describe('ensureBucket', () => {
    it('当 bucket 不存在时，应创建 bucket', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadBuffer(
        Buffer.from('test'),
        'test.txt',
        'text/plain',
        'avatars',
      );

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('assets');
      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith(
        'assets',
        'us-east-1',
      );
      expect(mockMinioClient.setBucketPolicy).toHaveBeenCalledWith(
        'assets',
        expect.any(String),
      );
    });

    it('当 bucket 已存在时，不应创建 bucket', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(true);
      mockMinioClient.putObject.mockResolvedValue(undefined);

      const result = await service.uploadBuffer(
        Buffer.from('test'),
        'test.txt',
        'text/plain',
        'avatars',
      );

      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('assets');
      expect(mockMinioClient.makeBucket).not.toHaveBeenCalled();
      expect(result).toContain('/assets/');
    });
  });
});
