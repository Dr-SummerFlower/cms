import { ApiProperty } from '@nestjs/swagger';
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
 * 更新用户资料接口的请求体数据传输对象。
 */
export class UpdateUserDto {
  /** 新用户名。 */
  @ApiProperty({
    description: '用户名',
    required: false,
    example: 'new_name',
    minLength: 4,
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(4, { message: '用户名至少4个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  username?: string;

  /** 新邮箱地址。 */
  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'new_mail@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  /** 更新密码时提供的旧密码。 */
  @ApiProperty({
    description: '旧密码',
    required: false,
    example: '@User123456',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少8个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: '密码必须包含大小写字母和数字',
  })
  password?: string;

  /** 准备更新的新密码。 */
  @ApiProperty({
    description: '新密码',
    required: false,
    example: '@User123456',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码至少8个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: '新密码必须包含大小写字母和数字',
  })
  newPassword?: string;

  /** 邮箱验证码。 */
  @ApiProperty({
    description: '邮箱验证码',
    required: false,
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  emailCode?: string;
}
