import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

/**
 * 发送验证码数据传输对象
 * @class SendCodeDto
 * @description 定义发送邮箱验证码时需要提供的数据结构
 */
export class SendCodeDto {
  /**
   * 邮箱地址
   * @type {string}
   * @description 接收验证码的邮箱地址
   */
  @ApiProperty({
    description: '接收验证码的邮箱地址',
    example: '3606006150@qq.com',
    format: 'email',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  /**
   * 验证码类型
   * @type {'register' | 'update'}
   * @description 验证码的使用类型，注册或更新
   */
  @ApiProperty({
    description: '验证码类型',
    example: 'register',
    enum: ['register', 'update'],
  })
  @IsString({ message: '类型必须是字符串' })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsIn(['register', 'update'], { message: '类型只能是register或update' })
  type: 'register' | 'update';
}
