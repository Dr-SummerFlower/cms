import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * 创建演唱会接口的请求体数据传输对象。
 */
export class CreateConcertDto {
  /** 演唱会名称。 */
  @ApiProperty({
    description: '演唱会名称',
    example: '周杰伦2025世界巡回演唱会-北京站',
  })
  @IsString({ message: '演唱会名称必须是字符串' })
  @IsNotEmpty({ message: '演唱会名称不能为空' })
  name: string;

  /** 演出日期。 */
  @ApiProperty({
    description: '演出日期',
    example: '2025-09-01T19:30:00.000Z',
    type: String,
  })
  @IsDateString({}, { message: '请输入有效的日期格式' })
  date: Date;

  /** 演出场馆。 */
  @ApiProperty({ description: '演出场馆', example: '北京国家体育场（鸟巢）' })
  @IsString({ message: '演出场馆必须是字符串' })
  @IsNotEmpty({ message: '演出场馆不能为空' })
  venue: string;

  /** 成人票价格。 */
  @ApiProperty({ description: '成人票价格', example: 680 })
  // 兼容表单字符串输入，统一转换为数值后再做校验。
  @Transform(({ value }): number => {
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '成人票价格必须是数字' })
  @Min(0, { message: '成人票价格不能为负数' })
  adultPrice: number;

  /** 儿童票价格。 */
  @ApiProperty({ description: '儿童票价格', example: 380 })
  // 兼容表单字符串输入，统一转换为数值后再做校验。
  @Transform(({ value }): number => {
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '儿童票价格必须是数字' })
  @Min(0, { message: '儿童票价格不能为负数' })
  childPrice: number;

  /** 演唱会总票数。 */
  @ApiProperty({ description: '总票数', example: 5000 })
  // 兼容表单字符串输入，统一转换为数值后再做校验。
  @Transform(({ value }): number => {
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '总票数必须是数字' })
  @Min(1, { message: '总票数至少为1' })
  totalTickets: number;

  /** 单个用户可购买的成人票上限。 */
  @ApiProperty({
    description: '每个用户成人票购买限制',
    required: false,
    example: 2,
  })
  @IsOptional()
  // 空字符串在 multipart/form-data 中视为未提供，避免被错误转换成 0。
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '成人票购买限制必须是数字' })
  @Min(1, { message: '成人票购买限制至少为1' })
  maxAdultTicketsPerUser?: number;

  /** 单个用户可购买的儿童票上限。 */
  @ApiProperty({
    description: '每个用户儿童票购买限制',
    required: false,
    example: 1,
  })
  @IsOptional()
  // 空字符串在 multipart/form-data 中视为未提供，避免被错误转换成 0。
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '儿童票购买限制必须是数字' })
  @Min(1, { message: '儿童票购买限制至少为1' })
  maxChildTicketsPerUser?: number;

  /** 演唱会描述。 */
  @ApiProperty({
    description: '演唱会描述',
    required: false,
    example: '本次巡演将带来全新曲目与经典回顾',
  })
  @IsOptional()
  @IsString({ message: '演唱会描述必须是字符串' })
  description?: string;
}
