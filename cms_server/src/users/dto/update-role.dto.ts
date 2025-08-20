import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: '角色',
    example: 'ADMIN',
    enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'],
  })
  @IsEnum(['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], {
    message: '权限必须是 GUEST、USER、ADMIN 或 INSPECTOR 之一',
  })
  @IsNotEmpty({ message: '权限不能为空' })
  role: string;
}
