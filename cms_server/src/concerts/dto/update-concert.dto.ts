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

export class UpdateConcertDto {
  @ApiProperty({
    description: '演唱会名称',
    required: false,
    example: '周杰伦2025世界巡回演唱会-上海站',
  })
  @IsOptional()
  @IsString({ message: '演唱会名称必须是字符串' })
  @IsNotEmpty({ message: '演唱会名称不能为空' })
  name?: string;

  @ApiProperty({
    description: '演出日期',
    required: false,
    example: '2025-10-01T19:30:00.000Z',
    type: String,
  })
  @IsOptional()
  @IsDateString({}, { message: '请输入有效的日期格式' })
  date?: Date;

  @ApiProperty({
    description: '演出场馆',
    required: false,
    example: '上海梅赛德斯-奔驰文化中心',
  })
  @IsOptional()
  @IsString({ message: '演出场馆必须是字符串' })
  @IsNotEmpty({ message: '演出场馆不能为空' })
  venue?: string;

  @ApiProperty({ description: '成人票价格', required: false, example: 780 })
  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '成人票价格必须是数字' })
  @Min(0, { message: '成人票价格不能为负数' })
  adultPrice?: number;

  @ApiProperty({ description: '儿童票价格', required: false, example: 420 })
  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '儿童票价格必须是数字' })
  @Min(0, { message: '儿童票价格不能为负数' })
  childPrice?: number;

  @ApiProperty({ description: '总票数', required: false, example: 6000 })
  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '总票数必须是数字' })
  @Min(1, { message: '总票数至少为1' })
  totalTickets?: number;

  @ApiProperty({
    description: '每个用户成人票购买限制',
    required: false,
    example: 2,
  })
  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '成人票购买限制必须是数字' })
  @Min(1, { message: '成人票购买限制至少为1' })
  maxAdultTicketsPerUser?: number;

  @ApiProperty({
    description: '每个用户儿童票购买限制',
    required: false,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    const num: number = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '儿童票购买限制必须是数字' })
  @Min(1, { message: '儿童票购买限制至少为1' })
  maxChildTicketsPerUser?: number;

  @ApiProperty({
    description: '演唱会描述',
    required: false,
    example: '更新描述：新增嘉宾与特别环节',
  })
  @IsOptional()
  @IsString({ message: '演唱会描述必须是字符串' })
  description?: string;
}
