import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

/**
 * 分页查询数据传输对象
 * @class PaginationDto
 * @description 定义分页查询时的通用参数
 */
export class PaginationDto {
  /**
   * 页码
   * @type {number}
   * @description 分页查询的页码，默认为1，必须是正整数
   */
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

  /**
   * 每页数量
   * @type {number}
   * @description 每页返回的记录数量，默认为10，必须是正整数
   */
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

  /**
   * 搜索关键词
   * @type {string}
   * @description 搜索关键词，可按用户名或邮箱进行模糊搜索，可选字段
   */
  @ApiPropertyOptional({
    description: '搜索关键词（用户名或邮箱）',
    example: 'test',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
