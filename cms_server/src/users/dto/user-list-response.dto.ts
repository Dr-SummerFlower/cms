import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserListResponseDto {
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

  @ApiProperty({ description: '总条目数', example: 42 })
  total: number;

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  limit: number;

  @ApiProperty({ description: '总页数', example: 5 })
  totalPages: number;
}
