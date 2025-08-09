import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * 更新用户信息数据传输对象
 * @class UpdateUserDto
 * @description 定义更新用户信息时需要提供的数据结构
 */
export class UpdateUserDto {
  /**
   * 用户名
   * @type {string}
   * @description 用户的用户名，长度必须在4-20个字符之间，可选字段
   */
  @ApiPropertyOptional({
    description: '用户名',
    example: 'newusername',
    minLength: 4,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(4, { message: '用户名至少4个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  username?: string;

  /**
   * 邮箱地址
   * @type {string}
   * @description 用户的邮箱地址，必须是有效的邮箱格式，可选字段
   */
  @ApiPropertyOptional({
    description: '用户邮箱',
    example: 'newemail@example.com',
    format: 'email',
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  /**
   * 密码
   * @type {string}
   * @description 用户的密码，至少8个字符，必须包含大小写字母和数字，可选字段
   */
  @ApiPropertyOptional({
    description: '新密码，必须包含大小写字母和数字',
    example: 'NewPassword123',
    minLength: 8,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$',
  })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少8个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: '密码必须包含大小写字母和数字',
  })
  password?: string;

  /**
   * 邮箱验证码
   * @type {string}
   * @description 邮箱验证码，更新邮箱或密码时必需，可选字段
   */
  @ApiPropertyOptional({
    description: '邮箱验证码（更新邮箱或密码时必需）',
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  emailCode?: string;
}
