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

export class UpdateUserDto {
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

  @ApiProperty({
    description: '邮箱',
    required: false,
    example: 'new_mail@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @ApiProperty({
    description: '密码',
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
