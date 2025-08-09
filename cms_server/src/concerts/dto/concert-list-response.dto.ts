import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '../entities/concert.entity';

export class ConcertListResponseDto {
  @ApiProperty({
    description: '演唱会列表',
    type: [Concert],
  })
  concerts: Concert[];

  @ApiProperty({
    description: '总数量',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '每页数量',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: '总页数',
    example: 10,
  })
  totalPages: number;
}
