import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginationDto {
  @ApiProperty({ description: '页码', required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @IsPositive({ message: '页码必须是正数' })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @IsPositive({ message: '每页数量必须是正数' })
  limit?: number = 10;

  @ApiProperty({ description: '搜索关键词', required: false, example: 'admin' })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
