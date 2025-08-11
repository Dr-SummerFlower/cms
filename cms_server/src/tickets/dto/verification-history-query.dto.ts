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
  @IsOptional()
  @IsMongoId({ message: '演唱会ID格式不正确' })
  concertId?: string;

  /**
   * 日期
   * @type {string}
   * @description 按日期筛选验证记录
   */
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  date?: string;
}
