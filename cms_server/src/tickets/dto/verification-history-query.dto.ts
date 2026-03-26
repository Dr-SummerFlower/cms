import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

/**
 * 验票历史查询参数数据传输对象。
 */
export class VerificationHistoryQueryDto {
  /** 演唱会 ID。 */
  @ApiProperty({
    description: '演唱会ID（可选）',
    required: false,
    example: '66c1234567890abcdef0456',
  })
  @IsOptional()
  @IsMongoId({ message: '演唱会ID格式不正确' })
  concertId?: string;

  /** 查询范围开始时间。 */
  @ApiProperty({
    description: '开始日期(ISO字符串，可选)',
    required: false,
    example: '2025-08-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  startDate?: string;

  /** 查询范围结束时间。 */
  @ApiProperty({
    description: '结束日期(ISO字符串，可选)',
    required: false,
    example: '2025-08-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  endDate?: string;

  /** 检票员 ID。 */
  @ApiProperty({
    description: '检票员ID（可选）',
    required: false,
    example: '66i000000000000000000001',
  })
  @IsOptional()
  @IsMongoId({ message: '检票员ID格式不正确' })
  inspectorId?: string;
}
