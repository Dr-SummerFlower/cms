import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * 退票申请列表查询参数数据传输对象。
 */
export class RefundRequestQueryDto {
  /** 退票申请状态。 */
  @ApiProperty({
    description: '申请状态（可选）',
    required: false,
    enum: ['pending', 'approved', 'rejected'],
    example: 'pending',
  })
  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  @IsIn(['pending', 'approved', 'rejected'], {
    message: '状态只能是pending、approved或rejected',
  })
  status?: 'pending' | 'approved' | 'rejected';

  /** 按演唱会筛选。 */
  @ApiProperty({
    description: '演唱会ID（可选）',
    required: false,
    example: '66c1234567890abcdef0456',
  })
  @IsOptional()
  @IsString({ message: '演唱会ID必须是字符串' })
  concertId?: string;

  /** 按用户筛选。 */
  @ApiProperty({
    description: '用户ID（可选）',
    required: false,
    example: '66u000000000000000000001',
  })
  @IsOptional()
  @IsString({ message: '用户ID必须是字符串' })
  userId?: string;
}
