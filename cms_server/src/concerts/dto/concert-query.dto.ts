import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ConcertQueryDto {
  @ApiPropertyOptional({
    description: '演唱会状态',
    enum: ['upcoming', 'ongoing', 'completed'],
    example: 'upcoming',
  })
  @IsOptional()
  @IsEnum(['upcoming', 'ongoing', 'completed'], {
    message: '状态必须是 upcoming、ongoing 或 completed 之一',
  })
  status?: 'upcoming' | 'ongoing' | 'completed';

  @ApiPropertyOptional({
    description: '按名称搜索',
    example: '周杰伦',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Transform(({ value }: { value: string }): number => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Transform(({ value }: { value: string }): number => parseInt(value) || 10)
  limit?: number = 10;
}
