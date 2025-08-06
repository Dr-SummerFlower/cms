import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SendCodeDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @IsString({ message: '类型必须是字符串' })
  @IsNotEmpty({ message: '类型不能为空' })
  @IsIn(['register', 'update'], { message: '类型只能是register或update' })
  type: 'register' | 'update';
}
