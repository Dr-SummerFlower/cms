import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * 用户列表接口的响应体数据传输对象。
 */
export class UserListResponseDto {
  /** 当前页用户列表。 */
  @ApiProperty({
    description: '用户列表',
    type: [User],
    example: [
      {
        _id: '66u000000000000000000001',
        username: 'user1',
        email: 'user1@example.com',
        role: 'user',
      },
    ],
  })
  users: User[];

  /** 总条目数。 */
  @ApiProperty({ description: '总条目数', example: 42 })
  total: number;

  /** 当前页码。 */
  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  /** 每页数量。 */
  @ApiProperty({ description: '每页数量', example: 10 })
  limit: number;

  /** 总页数。 */
  @ApiProperty({ description: '总页数', example: 5 })
  totalPages: number;
}
