import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '../entities/concert.entity';

/**
 * 演唱会列表接口的响应体数据传输对象。
 */
export class ConcertListResponseDto {
  /** 当前页返回的演唱会列表。 */
  @ApiProperty({
    description: '演唱会列表',
    type: [Concert],
    example: [
      {
        _id: '66c1234567890abcdef0456',
        name: '示例演唱会',
        venue: '北京国家体育场',
        date: '2025-08-20T19:30:00.000Z',
      },
    ],
  })
  concerts: Concert[];

  /** 符合筛选条件的总条目数。 */
  @ApiProperty({ description: '总条目数', example: 120 })
  total: number;

  /** 当前页码。 */
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  /** 每页返回的条目数。 */
  @ApiProperty({ description: '每页数量', example: 10 })
  limit: number;

  /** 总页数。 */
  @ApiProperty({ description: '总页数', example: 12 })
  totalPages: number;
}
