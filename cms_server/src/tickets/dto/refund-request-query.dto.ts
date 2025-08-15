import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * 退票申请查询数据传输对象
 * @description 定义查询退票申请列表所需的数据结构
 */
export class RefundRequestQueryDto {
  /**
   * 申请状态
   * @type {string}
   * @description 退票申请的状态：pending(待审核)、approved(已通过)、rejected(已拒绝)
   */
  @ApiProperty({
    description: '申请状态',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
    required: false,
  })
  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  @IsIn(['pending', 'approved', 'rejected'], {
    message: '状态只能是pending、approved或rejected',
  })
  status?: 'pending' | 'approved' | 'rejected';

  /**
   * 演唱会ID
   * @type {string}
   * @description 按演唱会ID筛选退票申请
   */
  @ApiProperty({
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '演唱会ID必须是字符串' })
  concertId?: string;

  /**
   * 用户ID
   * @type {string}
   * @description 按用户ID筛选退票申请
   */
  @ApiProperty({
    description: '用户ID',
    example: '507f1f77bcf86cd799439013',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '用户ID必须是字符串' })
  userId?: string;
}
