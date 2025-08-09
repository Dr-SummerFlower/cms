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
import { UpdateData, UserData } from '../types';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: UserData): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findOne(email: string): Promise<User> {
    return (await this.userModel.findOne({ email })) as User;
  }

  async findOneById(id: string): Promise<User> {
    const user: User = (await this.userModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findAll(paginationDto: PaginationDto): Promise<UserListResponseDto> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip: number = (page - 1) * limit;

    const query: FilterQuery<UserDocument> = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    const totalPages: number = Math.ceil(total / limit);

    return {
      users: data as User[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, updateData: UpdateData): Promise<User> {
    const user = (await this.userModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (updateData.username) {
      user.username = updateData.username;
    }
    if (updateData.email) {
      const existingUser = (await this.userModel.findOne({
        email: updateData.email,
        _id: { $ne: id },
      })) as User;

      if (existingUser) {
        throw new BadRequestException('该邮箱已被使用');
      }

      user.email = updateData.email;
    }
    if (updateData.password) {
      user.password = updateData.password;
    }

    await user.save();
    return user;
  }

  async updateRole(id: string, role: string): Promise<User> {
    const user: User = (await this.userModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.role = role;
    await user.save();
    return user;
  }

  async remove(id: string): Promise<void> {
    const user: User = (await this.userModel.findByIdAndDelete(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
  }
}
