import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * 用户登录数据传输对象
 * @class LoginDto
 * @description 定义用户登录时需要提供的数据结构
 */
export class LoginDto {
  /**
   * 用户邮箱
   * @type {string}
   * @description 用户登录邮箱地址
   */
  @ApiProperty({
    description: '用户邮箱',
    example: '3606006150@qq.com',
    format: 'email',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  /**
   * 用户密码
   * @type {string}
   * @description 用户登录密码
   */
  @ApiProperty({
    description: '用户密码',
    example: '@Qwer123456',
    minLength: 8,
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}
