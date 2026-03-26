import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 演唱会列表查询接口的请求参数数据传输对象。
 */
export class ConcertQueryDto {
  /** 按演唱会状态筛选。 */
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

  /** 按名称关键字模糊搜索。 */
  @ApiProperty({
    description: '搜索关键词（可选）',
    required: false,
    example: '五月天',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  /** 分页页码，默认为 1。 */
  @ApiProperty({
    description: '页码（可选）',
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  // 将查询字符串转换为数字，未传值时回退到默认页码。
  @Transform(({ value }: { value: string }): number => parseInt(value) || 1)
  page?: number = 1;

  /** 每页返回数量，默认为 10。 */
  @ApiProperty({
    description: '每页数量（可选）',
    required: false,
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '每页数量必须是数字' })
  // 将查询字符串转换为数字，未传值时回退到默认条数。
  @Transform(({ value }: { value: string }): number => parseInt(value) || 10)
  limit?: number = 10;
}
