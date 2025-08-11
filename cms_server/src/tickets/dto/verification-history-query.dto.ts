import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

/**
 * 验证历史查询数据传输对象
 * @description 定义查询票据验证历史记录时的筛选条件
 */
export class VerificationHistoryQueryDto {
  /**
   * 演唱会ID
   * @type {string}
   * @description 按演唱会筛选验证记录
   */
  @ApiPropertyOptional({
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: '演唱会ID格式不正确' })
  concertId?: string;

  /**
   * 开始日期
   * @type {string}
   * @description 查询验证记录的开始日期
   */
  @ApiPropertyOptional({
    description: '开始日期',
    example: '2024-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  startDate?: string;

  /**
   * 结束日期
   * @type {string}
   * @description 查询验证记录的结束日期
   */
  @ApiPropertyOptional({
    description: '结束日期',
    example: '2024-01-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  endDate?: string;

  /**
   * 检票员ID
   * @type {string}
   * @description 按检票员筛选验证记录
   */
  @ApiPropertyOptional({
    description: '检票员ID',
    example: '507f1f77bcf86cd799439015',
  })
  @IsOptional()
  @IsMongoId({ message: '检票员ID格式不正确' })
  inspectorId?: string;
}
