import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * 退票数据传输对象
 * @description 定义退票操作所需的数据结构
 */
export class RefundTicketDto {
  /**
   * 退票原因
   * @type {string}
   * @description 用户申请退票的原因说明
   */
  @IsString({ message: '退票原因必须是字符串' })
  @IsNotEmpty({ message: '退票原因不能为空' })
  @MaxLength(500, { message: '退票原因最多500个字符' })
  reason: string;
}
