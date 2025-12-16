import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';

@ApiTags('代理')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @ApiOperation({
    summary: '代理minio文件',
    description: '通过服务端代理访问minio存储桶中的文件',
  })
  @Get('*path')
  async proxyFile(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // 从请求URL中提取路径部分
      // 例如：/api/proxy/assets/poster/xxx.jpg -> assets/poster/xxx.jpg
      const fullPath = req.url; // 例如：/api/proxy/assets/poster/xxx.jpg
      const proxyPrefix = '/api/proxy';

      // 提取proxy后面的路径
      let path = fullPath.startsWith(proxyPrefix)
        ? fullPath.substring(proxyPrefix.length)
        : fullPath;

      // 去掉前导斜杠
      if (path.startsWith('/')) {
        path = path.substring(1);
      }

      const { stream, contentType, contentLength } =
        await this.proxyService.getFile(path);

      // 设置响应头
      res.set({
        'Content-Type': contentType,
        'Content-Length': contentLength.toString(),
        'Cache-Control': 'public, max-age=31536000',
      });

      // 直接通过response发送流，避免被全局拦截器包装
      stream.pipe(res);
    } catch (error: unknown) {
      // 调试日志：记录错误
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`无法获取文件: ${req.url}`);
    }
  }
}
