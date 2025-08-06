import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @IsPositive({ message: '页码必须是正数' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @IsPositive({ message: '每页数量必须是正数' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '搜索关键词（用户名或邮箱）',
    example: 'test',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
