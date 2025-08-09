import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendCodeDto } from './dto/send-code.dto';
import { EmailService } from './email.service';

/**
 * 邮件控制器
 * @description 处理邮件相关的HTTP请求，提供邮件发送功能的API接口
 */
@ApiTags('邮件服务')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @ApiOperation({
    summary: '发送邮箱验证码',
    description:
      '发送邮箱验证码，用于用户注册、密码重置等场景。此接口为公开接口，无需权限验证。',
  })
  @ApiBody({ type: SendCodeDto })
  @ApiResponse({
    status: 200,
    description: '验证码发送成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: '验证码已发送' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 400 },
        message: { type: 'string', example: '请输入有效的邮箱地址' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/email/send-code' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '请求过于频繁',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 429 },
        message: { type: 'string', example: '请求过于频繁，请稍后再试' },
        data: { type: 'null' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/email/send-code' },
      },
    },
  })
  @Post()
  /**
   * 发送邮箱验证码接口
   * @description 发送邮箱验证码，用于用户注册、密码重置等场景
   * @param sendCodeDto 发送验证码的数据传输对象
   * @returns 返回发送结果
   */
  sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ success: boolean }> {
    return this.emailService.sendCode(sendCodeDto);
  }
}
