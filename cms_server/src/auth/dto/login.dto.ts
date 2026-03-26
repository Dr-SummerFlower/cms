import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * 登录接口的请求体数据传输对象。
 */
export class LoginDto {
  /** 用户登录邮箱。 */
  @ApiProperty({ description: '邮箱', example: 'user@user.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  /** 用户登录密码。 */
  @ApiProperty({ description: '密码', example: '@User123456' })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  /** 图形验证码的唯一标识。 */
  @ApiProperty({
    description: '验证码ID（从获取验证码接口获取）',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: '验证码ID格式不正确' })
  @IsNotEmpty({ message: '验证码ID不能为空' })
  captchaId: string;

  /** 用户输入的图形验证码文本。 */
  @ApiProperty({
    description: '验证码（图片中显示的文本）',
    example: 'A3bC',
  })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  captchaCode: string;
}
