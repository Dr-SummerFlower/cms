import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * 管理员审核退票数据传输对象
 * @description 定义管理员审核退票申请所需的数据结构
 */
export class AdminReviewRefundDto {
  /**
   * 审核决定
   * @type {boolean}
   * @description 管理员的审核决定，true为通过，false为拒绝
   */
  @ApiProperty({
    description: '审核决定，true为通过，false为拒绝',
    example: true,
  })
  @IsBoolean({ message: '审核决定必须是布尔值' })
  @IsNotEmpty({ message: '审核决定不能为空' })
  approved: boolean;

  /**
   * 审核备注
   * @type {string}
   * @description 管理员审核时的备注说明，拒绝时必填
   */
  @ApiProperty({
    description: '审核备注说明',
    example: '符合退票条件，同意退票',
    maxLength: 500,
    required: false,
  })
  @IsString({ message: '审核备注必须是字符串' })
  @IsOptional()
  @MaxLength(500, { message: '审核备注最多500个字符' })
  reviewNote?: string;
}
