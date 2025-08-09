import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * 更新用户角色数据传输对象
 * @class UpdateRoleDto
 * @description 定义更新用户角色时需要提供的数据结构
 */
export class UpdateRoleDto {
  /**
   * 用户角色
   * @type {string}
   * @description 用户的角色权限，可选值：GUEST、USER、ADMIN、INSPECTOR
   */
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
