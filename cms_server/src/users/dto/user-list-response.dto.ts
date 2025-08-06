import { User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserListResponseDto {
  @ApiProperty({
    description: '用户列表',
    type: [User],
  })
  users: User[];

  @ApiProperty({
    description: '总记录数',
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
