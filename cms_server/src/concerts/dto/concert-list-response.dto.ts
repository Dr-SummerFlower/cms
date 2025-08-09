import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '../entities/concert.entity';

/**
 * 演唱会列表响应数据传输对象
 * @class ConcertListResponseDto
 * @description 定义演唱会列表查询的响应数据结构
 */
export class ConcertListResponseDto {
  /**
   * 演唱会列表
   * @type {Concert[]}
   * @description 查询到的演唱会数据列表
   */
  @ApiProperty({
    description: '演唱会列表',
    type: [Concert],
  })
  concerts: Concert[];

  /**
   * 总数量
   * @type {number}
   * @description 符合查询条件的演唱会总数量
   */
  @ApiProperty({
    description: '总数量',
    example: 100,
  })
  total: number;

  /**
   * 当前页码
   * @type {number}
   * @description 当前查询的页码
   */
  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number;

  /**
   * 每页数量
   * @type {number}
   * @description 每页返回的记录数量
   */
  @ApiProperty({
    description: '每页数量',
    example: 10,
  })
  limit: number;

  /**
   * 总页数
   * @type {number}
   * @description 根据总数量和每页数量计算出的总页数
   */
  @ApiProperty({
    description: '总页数',
    example: 10,
  })
  totalPages: number;
}
