import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as Minio from 'minio';
import { PassThrough } from 'stream';
import { ProxyService } from '../../../src/proxy/proxy.service';

const mockMinioClient = {
  statObject: jest.fn(),
  getObject: jest.fn(),
};

const createReadableStream = (data: string = 'mock data') => {
  const stream = new PassThrough();
  stream.end(data);
  return stream;
};

describe('ProxyService', () => {
  let service: ProxyService;
  let configService: ConfigService;

  beforeEach(async () => {
    configService = new ConfigService();

    jest
      .spyOn(Minio, 'Client')
      .mockImplementation(() => mockMinioClient as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<ProxyService>(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('服务实例应被正确定义', () => {
    expect(service).toBeDefined();
  });

  describe('getFile', () => {
    it('当对象存在时，应返回文件流和元数据', async () => {
      const objectPath = '/assets/avatar/test.jpg';
      const mockStatResult = {
        size: 1024,
        metaData: {
          'content-type': 'image/jpeg',
        },
      };
      const mockStream = createReadableStream('mock image data');

      mockMinioClient.statObject.mockResolvedValue(mockStatResult);
      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getFile(objectPath);

      expect(mockMinioClient.statObject).toHaveBeenCalledWith(
        'assets',
        'avatar/test.jpg',
      );
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'assets',
        'avatar/test.jpg',
      );
      expect(result.stream).toBeDefined();
      expect(result.contentType).toBe('image/jpeg');
      expect(result.contentLength).toBe(1024);
    });

    it('应正确处理不带前导斜杠的路径', async () => {
      const objectPath = 'assets/avatar/test.jpg';
      const mockStatResult = {
        size: 2048,
        metaData: {
          'Content-Type': 'application/pdf',
        },
      };
      const mockStream = createReadableStream('mock pdf data');

      mockMinioClient.statObject.mockResolvedValue(mockStatResult);
      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getFile(objectPath);

      expect(mockMinioClient.statObject).toHaveBeenCalledWith(
        'assets',
        'avatar/test.jpg',
      );
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'assets',
        'avatar/test.jpg',
      );
      expect(result.contentType).toBe('application/pdf');
      expect(result.contentLength).toBe(2048);
    });

    it('应正确处理不带 bucket 前缀的对象路径', async () => {
      const objectPath = 'poster/event.jpg';
      const mockStatResult = {
        size: 512,
        metaData: {
          'content-type': 'image/png',
        },
      };
      const mockStream = createReadableStream();

      mockMinioClient.statObject.mockResolvedValue(mockStatResult);
      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getFile(objectPath);

      expect(mockMinioClient.statObject).toHaveBeenCalledWith(
        'assets',
        'poster/event.jpg',
      );
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'assets',
        'poster/event.jpg',
      );
      expect(result.contentType).toBe('image/png');
    });

    it('当路径只是 bucket 名称时，应抛出 NotFoundException', async () => {
      const objectPath = 'assets';

      await expect(service.getFile(objectPath)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMinioClient.statObject).not.toHaveBeenCalled();
    });

    it('当规范化后 objectName 为空时，应抛出 NotFoundException', async () => {
      const objectPath = '/';

      await expect(service.getFile(objectPath)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMinioClient.statObject).not.toHaveBeenCalled();
    });

    it('当没有 content type 时，应回退到 application/octet-stream', async () => {
      const objectPath = 'avatar/test.png';
      const mockStatResult = {
        size: 1024,
        metaData: {},
      };
      const mockStream = createReadableStream();

      mockMinioClient.statObject.mockResolvedValue(mockStatResult);
      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getFile(objectPath);

      expect(result.contentType).toBe('application/octet-stream');
    });

    it('当 minio 返回 NotFound 错误时，应抛出 NotFoundException', async () => {
      const objectPath = 'avatar/missing.jpg';

      const minioError = new Error('The specified key does not exist.');
      (minioError as any).code = 'NotFound';

      mockMinioClient.statObject.mockRejectedValue(minioError);

      await expect(service.getFile(objectPath)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMinioClient.statObject).toHaveBeenCalledWith(
        'assets',
        'avatar/missing.jpg',
      );
    });

    it('应将 NoSuchKey 错误代码处理为 NotFoundException', async () => {
      const objectPath = 'avatar/missing.jpg';

      const minioError = new Error(' NoSuchKey ');
      (minioError as any).code = 'NoSuchKey';

      mockMinioClient.statObject.mockRejectedValue(minioError);

      await expect(service.getFile(objectPath)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('应传播其他错误', async () => {
      const objectPath = 'avatar/test.jpg';

      const customError = new Error('Some other error');

      mockMinioClient.statObject.mockRejectedValue(customError);

      await expect(service.getFile(objectPath)).rejects.toThrow(customError);
    });
  });
});
