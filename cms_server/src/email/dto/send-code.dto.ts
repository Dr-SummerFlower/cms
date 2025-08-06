import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendCodeDto {
  @ApiProperty({
    description: '接收验证码的邮箱地址',
    example: '3606006150@qq.com',
    format: 'email',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

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
