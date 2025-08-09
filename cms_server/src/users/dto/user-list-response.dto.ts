import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * 用户列表响应数据传输对象
 * @class UserListResponseDto
 * @description 定义用户列表查询的响应数据结构
 */
export class UserListResponseDto {
  /**
   * 用户列表
   * @type {User[]}
   * @description 当前页的用户数据列表
   */
  @ApiProperty({
    description: '用户列表',
    type: [User],
  })
  users: User[];

  /**
   * 总记录数
   * @type {number}
   * @description 符合查询条件的用户总数量
   */
  @ApiProperty({
    description: '总记录数',
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
   * @description 根据总记录数和每页数量计算的总页数
   */
  @ApiProperty({
    description: '总页数',
    example: 10,
  })
  totalPages: number;
}
