import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { TicketStatus } from '../../types';

/**
 * 票据查询数据传输对象
 * @description 定义查询票据时的筛选条件
 */
export class TicketQueryDto {
  /**
   * 票据状态
   * @type {TicketStatus}
   * @description 按票据状态筛选，可选值：valid(有效)、used(已使用)、refunded(已退票)
   */
  @ApiPropertyOptional({
    description: '票据状态',
    enum: ['valid', 'used', 'refunded'],
    example: 'valid',
  })
  @IsOptional()
  @IsIn(['valid', 'used', 'refunded'], {
    message: '票据状态必须是valid、used或refunded',
  })
  status?: TicketStatus;

  /**
   * 演唱会ID
   * @type {string}
   * @description 按演唱会筛选票据
   */
  @ApiPropertyOptional({
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: '演唱会ID格式不正确' })
  concertId?: string;
}
