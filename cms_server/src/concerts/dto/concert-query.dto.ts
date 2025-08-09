import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 演唱会查询数据传输对象
 * @class ConcertQueryDto
 * @description 定义查询演唱会列表时的查询参数
 */
export class ConcertQueryDto {
  /**
   * 演唱会状态
   * @type {'upcoming' | 'ongoing' | 'completed'}
   * @description 演唱会的状态筛选条件，可选字段
   */
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

  /**
   * 搜索关键词
   * @type {string}
   * @description 按演唱会名称进行模糊搜索的关键词，可选字段
   */
  @ApiPropertyOptional({
    description: '按名称搜索',
    example: '周杰伦',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  /**
   * 页码
   * @type {number}
   * @description 分页查询的页码，默认为1
   */
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Transform(({ value }: { value: string }): number => parseInt(value) || 1)
  page?: number = 1;

  /**
   * 每页数量
   * @type {number}
   * @description 分页查询每页返回的记录数量，默认为10
   */
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
