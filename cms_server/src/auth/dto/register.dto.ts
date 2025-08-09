import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 用户注册数据传输对象
 * @class RegisterDto
 * @description 定义用户注册时需要提供的数据结构
 */
export class RegisterDto {
  /**
   * 用户名
   * @type {string}
   * @description 用户注册用户名，长度4-20个字符
   */
  @ApiProperty({
    description: '用户名',
    example: 'summer',
    minLength: 4,
    maxLength: 20,
  })
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(4, { message: '用户名至少4个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  username: string;

  /**
   * 用户邮箱
   * @type {string}
   * @description 用户注册邮箱地址
   */
  @ApiProperty({
    description: '用户邮箱',
    example: '3606006150@qq.com',
    format: 'email',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  /**
   * 用户密码
   * @type {string}
   * @description 用户注册密码，至少8个字符，必须包含大小写字母和数字
   */
  @ApiProperty({
    description: '用户密码，必须包含大小写字母和数字',
    example: '@Qwer123456',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$',
  })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: '密码必须包含大小写字母和数字',
  })
  password: string;

  /**
   * 邮箱验证码
   * @type {string}
   * @description 6位数字验证码
   */
  @ApiProperty({
    description: '邮箱验证码',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @MinLength(6, { message: '验证码必须是6位数字' })
  @MaxLength(6, { message: '验证码必须是6位数字' })
  code: string;
}
