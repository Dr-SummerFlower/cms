import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @IsPositive({ message: '页码必须是正数' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @IsPositive({ message: '每页数量必须是正数' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
