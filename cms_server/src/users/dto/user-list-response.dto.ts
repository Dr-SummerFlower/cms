import { User } from '../entities/user.entity';

export class UserListResponseDto {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
