import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { PaginationDto } from './dto/pagination.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly dbModel: Model<User>) {}

  async create(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    return (await this.dbModel.create(userData)) as User;
  }

  async findOne(email: string): Promise<User> {
    return (await this.dbModel.findOne({ email })) as User;
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.dbModel.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user as User;
  }

  async findAll(paginationDto: PaginationDto): Promise<UserListResponseDto> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const query: FilterQuery<UserDocument> = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.dbModel.find(query).skip(skip).limit(limit).exec(),
      this.dbModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: data as User[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(
    id: string,
    updateData: { username?: string; email?: string; password?: string },
  ): Promise<User> {
    const user = await this.dbModel.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (updateData.username) {
      user.username = updateData.username;
    }
    if (updateData.email) {
      const existingUser = await this.dbModel.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new BadRequestException('该邮箱已被使用');
      }

      user.email = updateData.email;
    }
    if (updateData.password) {
      user.password = updateData.password;
    }

    await user.save();
    return user as User;
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user: User = (await this.dbModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.role = role;
    await user.save();
    return user;
  }

  async remove(id: string): Promise<User> {
    const user: User = (await this.dbModel.findByIdAndDelete(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }
}
