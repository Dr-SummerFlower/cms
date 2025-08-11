import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * 创建演唱会数据传输对象
 * @class CreateConcertDto
 * @description 定义创建演唱会时需要提供的数据结构
 */
export class CreateConcertDto {
  /**
   * 演唱会名称
   * @type {string}
   * @description 演唱会的名称
   */
  @ApiProperty({
    description: '演唱会名称',
    example: '周杰伦演唱会',
  })
  @IsString({ message: '演唱会名称必须是字符串' })
  @IsNotEmpty({ message: '演唱会名称不能为空' })
  name: string;

  /**
   * 演唱会日期
   * @type {Date}
   * @description 演唱会举办的日期和时间
   */
  @ApiProperty({
    description: '演唱会日期',
    example: '2024-12-31T20:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: '请输入有效的日期格式' })
  date: Date;

  /**
   * 演出场馆
   * @type {string}
   * @description 演唱会举办的场馆名称
   */
  @ApiProperty({
    description: '演出场馆',
    example: '北京鸟巢体育场',
  })
  @IsString({ message: '演出场馆必须是字符串' })
  @IsNotEmpty({ message: '演出场馆不能为空' })
  venue: string;

  /**
   * 成人票价格
   * @type {number}
   * @description 成人票的价格，不能为负数
   */
  @ApiProperty({
    description: '成人票价格',
    example: 299,
    minimum: 0,
  })
  @IsNumber({}, { message: '成人票价格必须是数字' })
  @Min(0, { message: '成人票价格不能为负数' })
  adultPrice: number;

  /**
   * 儿童票价格
   * @type {number}
   * @description 儿童票的价格，不能为负数
   */
  @ApiProperty({
    description: '儿童票价格',
    example: 199,
    minimum: 0,
  })
  @IsNumber({}, { message: '儿童票价格必须是数字' })
  @Min(0, { message: '儿童票价格不能为负数' })
  childPrice: number;

  /**
   * 总票数
   * @type {number}
   * @description 演唱会的总票数，至少为1
   */
  @ApiProperty({
    description: '总票数',
    example: 1000,
    minimum: 1,
  })
  @IsNumber({}, { message: '总票数必须是数字' })
  @Min(1, { message: '总票数至少为1' })
  totalTickets: number;

  /**
   * 每个用户最多可购买的成人票数量
   * @type {number}
   * @description 单个用户最多可以购买的成人票数量，可选字段，默认为2
   */
  @ApiPropertyOptional({
    description: '每个用户最多可购买的成人票数量',
    example: 2,
    minimum: 1,
    default: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: '成人票购买限制必须是数字' })
  @Min(1, { message: '成人票购买限制至少为1' })
  maxAdultTicketsPerUser?: number;

  /**
   * 每个用户最多可购买的儿童票数量
   * @type {number}
   * @description 单个用户最多可以购买的儿童票数量，可选字段，默认为1
   */
  @ApiPropertyOptional({
    description: '每个用户最多可购买的儿童票数量',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '儿童票购买限制必须是数字' })
  @Min(1, { message: '儿童票购买限制至少为1' })
  maxChildTicketsPerUser?: number;

  /**
   * 演唱会描述
   * @type {string}
   * @description 演唱会的详细描述信息，可选字段
   */
  @ApiPropertyOptional({
    description: '演唱会描述',
    example: '周杰伦2024世界巡回演唱会北京站',
  })
  @IsOptional()
  @IsString({ message: '演唱会描述必须是字符串' })
  description?: string;
}
