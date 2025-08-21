import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateData, UserData } from '../types';
import { PaginationDto } from './dto/pagination.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: UserData): Promise<User> {
    try {
      return (await this.userModel.create(userData)) as User;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      if (error.code === 11000) {
        throw new ConflictException('该邮箱已被注册');
      }
      throw new InternalServerErrorException('创建用户时发生错误');
    }
  }

  async findOne(email: string): Promise<User> {
    try {
      if (!email || !email.includes('@')) {
        throw new BadRequestException('无效的邮箱格式');
      }

      return (await this.userModel
        .findOne({ email })
        .select('+password')) as User;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户时发生错误');
    }
  }

  async findOneById(id: string): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user: User = (await this.userModel.findById(id)) as User;
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户详情时发生错误');
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<UserListResponseDto> {
    try {
      const { page = 1, limit = 10, search } = paginationDto;

      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException(
          '页码和每页数量必须为正数，且每页数量不能超过100',
        );
      }

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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('获取用户列表时发生错误');
    }
  }

  async update(id: string, updateData: UpdateData): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user = (await this.userModel.findById(id).select('+password')) as User;
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

      if (updateData.newPassword) {
        if (!updateData.password) {
          throw new BadRequestException('更新密码需要提供旧密码');
        }
        
        const isOldPasswordValid = await bcrypt.compare(updateData.password, user.password);
        if (!isOldPasswordValid) {
          throw new BadRequestException('旧密码不正确');
        }
        
        user.password = updateData.newPassword;
      }

      await user.save();

      const result = await this.userModel.findById(user._id).exec();
      if (!result) {
        throw new InternalServerErrorException('更新后的用户信息未找到');
      }

      return result as User;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户信息时发生错误');
    }
  }

  async updateRole(id: string, role: string): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const validRoles = ['USER', 'ADMIN', 'INSPECTOR'];
      if (!validRoles.includes(role)) {
        throw new BadRequestException('无效的用户角色');
      }

      const user: User = (await this.userModel.findById(id)) as User;
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      user.role = role;
      await user.save();
      return user;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户角色时发生错误');
    }
  }

  async remove(id: string): Promise<null> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user: User = (await this.userModel.findByIdAndDelete(id)) as User;
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
      return null;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除用户时发生错误');
    }
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }
      const user = (await this.userModel.findById(id)) as User;
      if (!user) throw new NotFoundException('用户不存在');

      user.avatar = avatarUrl;
      await user.save();
      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户头像时发生错误');
    }
  }
}
