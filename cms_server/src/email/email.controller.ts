import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SendCodeDto } from './dto/send-code.dto';
import { EmailService } from './email.service';

@ApiTags('邮箱')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @ApiOperation({
    summary: '发送验证码',
    description: '发送注册或信息更新验证码到邮箱',
  })
  @ApiBody({
    description: '发送验证码请求体',
    type: SendCodeDto,
    examples: {
      register: {
        summary: '注册验证码',
        value: { email: 'user@user.com', type: 'register' },
      },
      update: {
        summary: '更新资料验证码',
        value: { email: 'admin@admin.com', type: 'update' },
      },
    },
  })
  @ApiOkResponse({
    description: '发送成功',
    content: {
      'application/json': {
        example: {
          code: 200,
          message: 'success',
          data: { success: true },
          timestamp: '2025-08-20T10:00:00.000Z',
          path: '/api/email',
        },
      },
    },
  })
  @Post()
  @HttpCode(200)
  sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ success: boolean }> {
    return this.emailService.sendCode(sendCodeDto);
  }
}
