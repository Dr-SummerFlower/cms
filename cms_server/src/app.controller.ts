import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: '欢迎/健康检查', description: '返回应用的欢迎信息' })
  @ApiOkResponse({
    description: '请求成功',
    schema: { type: 'string', example: 'Hello World!' },
  })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
