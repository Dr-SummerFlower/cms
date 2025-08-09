import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConcertDto {
  @ApiProperty({
    description: '演唱会名称',
    example: '周杰伦演唱会',
  })
  @IsString({ message: '演唱会名称必须是字符串' })
  @IsNotEmpty({ message: '演唱会名称不能为空' })
  name: string;

  @ApiProperty({
    description: '演唱会日期',
    example: '2024-12-31T20:00:00.000Z',
    format: 'date-time',
  })
  @IsDateString({}, { message: '请输入有效的日期格式' })
  date: Date;

  @ApiProperty({
    description: '演出场馆',
    example: '北京鸟巢体育场',
  })
  @IsString({ message: '演出场馆必须是字符串' })
  @IsNotEmpty({ message: '演出场馆不能为空' })
  venue: string;

  @ApiProperty({
    description: '成人票价格',
    example: 299,
    minimum: 0,
  })
  @IsNumber({}, { message: '成人票价格必须是数字' })
  @Min(0, { message: '成人票价格不能为负数' })
  adultPrice: number;

  @ApiProperty({
    description: '儿童票价格',
    example: 199,
    minimum: 0,
  })
  @IsNumber({}, { message: '儿童票价格必须是数字' })
  @Min(0, { message: '儿童票价格不能为负数' })
  childPrice: number;

  @ApiProperty({
    description: '总票数',
    example: 1000,
    minimum: 1,
  })
  @IsNumber({}, { message: '总票数必须是数字' })
  @Min(1, { message: '总票数至少为1' })
  totalTickets: number;

  @ApiPropertyOptional({
    description: '演唱会描述',
    example: '周杰伦2024世界巡回演唱会北京站',
  })
  @IsOptional()
  @IsString({ message: '演唱会描述必须是字符串' })
  description?: string;
}
