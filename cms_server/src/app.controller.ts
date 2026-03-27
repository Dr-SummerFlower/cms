import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppHealthStatus, AppService } from './app.service';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary: '健康检查',
    description: '用于健康检查',
  })
  @ApiOkResponse({
    description: '服务正常',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        uptime: { type: 'number', example: 42 },
      },
    },
  })
  @Get('health')
  getHealth(): AppHealthStatus {
    return this.appService.getHealth();
  }
}
