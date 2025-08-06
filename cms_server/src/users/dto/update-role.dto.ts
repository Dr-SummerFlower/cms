import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: '用户角色',
    example: 'USER',
    enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'],
  })
  @IsEnum(['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], {
    message: '权限必须是 GUEST、USER、ADMIN 或 INSPECTOR 之一',
  })
  @IsNotEmpty({ message: '权限不能为空' })
  role: string;
}
