import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 管理员审核退票申请的请求体数据传输对象。
 */
export class AdminReviewRefundDto {
  /** 是否通过本次退票申请。 */
  @ApiProperty({
    description: '是否通过（true为通过，false为拒绝）',
    example: true,
  })
  @IsBoolean({ message: '审核决定必须是布尔值' })
  @IsNotEmpty({ message: '审核决定不能为空' })
  approved: boolean;

  /** 审核备注或拒绝原因。 */
  @ApiProperty({
    description: '审核备注（可选，最多500字符）',
    required: false,
    example: '同意退款',
  })
  @IsString({ message: '审核备注必须是字符串' })
  @IsOptional()
  @MaxLength(500, { message: '审核备注最多500个字符' })
  reviewNote?: string;
}
