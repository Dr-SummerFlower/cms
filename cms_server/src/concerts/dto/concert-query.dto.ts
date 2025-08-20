import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConcertQueryDto {
  @ApiProperty({
    description: '状态（可选）',
    required: false,
    enum: ['upcoming', 'ongoing', 'completed'],
    example: 'upcoming',
  })
  @IsOptional()
  @IsEnum(['upcoming', 'ongoing', 'completed'], {
    message: '状态必须是 upcoming、ongoing 或 completed 之一',
  })
  status?: 'upcoming' | 'ongoing' | 'completed';

  @ApiProperty({
    description: '搜索关键词（可选）',
    required: false,
    example: '五月天',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  @ApiProperty({
    description: '页码（可选）',
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Transform(({ value }: { value: string }): number => parseInt(value) || 1)
  page?: number = 1;

  @ApiProperty({
    description: '每页数量（可选）',
    required: false,
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Transform(({ value }: { value: string }): number => parseInt(value) || 10)
  limit?: number = 10;
}
