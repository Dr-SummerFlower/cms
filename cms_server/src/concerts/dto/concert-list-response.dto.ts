import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '../entities/concert.entity';

export class ConcertListResponseDto {
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

  @ApiProperty({ description: '总条目数', example: 120 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  limit: number;

  @ApiProperty({ description: '总页数', example: 12 })
  totalPages: number;
}
