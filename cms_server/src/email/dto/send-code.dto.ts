import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendCodeDto {
  @ApiProperty({ description: '邮箱', example: 'user@user.com' })
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
