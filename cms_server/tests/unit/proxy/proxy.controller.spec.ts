/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { ProxyController } from '../../../src/proxy/proxy.controller';
import { ProxyService } from '../../../src/proxy/proxy.service';

const createMockStream = (): Partial<Readable> => {
  return {
    pipe: jest.fn(),
  } as Partial<Readable>;
};

const createMockResponse = (): Partial<Response> => {
  return {
    set: jest.fn().mockReturnThis(),
    pipe: jest.fn(),
  } as Partial<Response>;
};

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            getFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  it('控制器和服务实例应被正确定义', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('proxyFile', () => {
    it('当路径存在时，应返回文件', async () => {
      const mockRequest = {
        url: '/api/proxy/assets/avatar/test.jpg',
      } as Request;
      const mockResponse = createMockResponse() as Response;
      const mockFileStream = createMockStream();
      const mockContentType = 'image/jpeg';
      const mockContentSize = 1024;

      jest.spyOn(service, 'getFile').mockResolvedValue({
        stream: mockFileStream as Readable,
        contentType: mockContentType,
        contentLength: mockContentSize,
      });

      await controller.proxyFile(mockRequest, mockResponse);

      expect(service.getFile).toHaveBeenCalledWith('assets/avatar/test.jpg');
      expect((mockResponse.set as jest.Mock).mock.calls[0][0]).toEqual({
        'Content-Type': mockContentType,
        'Content-Length': mockContentSize.toString(),
        'Cache-Control': 'public, max-age=31536000',
      });
      expect(mockFileStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('应正确解析不同的路径格式', async () => {
      const mockRequest = {
        url: '/api/proxy/avatar/profile.jpg',
      } as Request;
      const mockResponse = createMockResponse() as Response;
      const mockFileStream = createMockStream();
      const mockContentType = 'image/png';
      const mockContentSize = 2048;

      jest.spyOn(service, 'getFile').mockResolvedValue({
        stream: mockFileStream as Readable,
        contentType: mockContentType,
        contentLength: mockContentSize,
      });

      await controller.proxyFile(mockRequest, mockResponse);

      expect(service.getFile).toHaveBeenCalledWith('avatar/profile.jpg');
    });

    it('应正确从包含额外段的 URL 中提取路径', async () => {
      const mockRequest = {
        url: '/api/proxy/assets/poster/event/2024/summer.jpg',
      } as Request;
      const mockResponse = createMockResponse() as Response;
      const mockFileStream = createMockStream();
      const mockContentType = 'image/jpeg';
      const mockContentSize = 4096;

      jest.spyOn(service, 'getFile').mockResolvedValue({
        stream: mockFileStream as Readable,
        contentType: mockContentType,
        contentLength: mockContentSize,
      });

      const expectedPath = 'assets/poster/event/2024/summer.jpg';

      await controller.proxyFile(mockRequest, mockResponse);

      expect(service.getFile).toHaveBeenCalledWith(expectedPath);
    });

    it('当文件不存在时，应正确处理 NotFoundException', async () => {
      const mockRequest = {
        url: '/api/proxy/nonexistent/file.jpg',
      } as Request;
      const mockResponse = createMockResponse() as Response;
      const notFoundError = new NotFoundException('File does not exist');

      jest.spyOn(service, 'getFile').mockRejectedValue(notFoundError);

      await expect(
        controller.proxyFile(mockRequest, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });

    it('当文件检索过程中发生其他错误时，应抛出 NotFoundException', async () => {
      const mockRequest = {
        url: '/api/proxy/nonexistent/file.jpg',
      } as Request;
      const mockResponse = createMockResponse() as Response;
      const genericError = new Error('Generic error');

      jest.spyOn(service, 'getFile').mockRejectedValue(genericError);

      await expect(
        controller.proxyFile(mockRequest, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
