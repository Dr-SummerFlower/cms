import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { UpdateData, UserData } from '../types';
import { PaginationDto } from './dto/pagination.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { User, UserDocument } from './entities/user.entity';

/**
 * 用户服务类
 * @description 处理用户相关的业务逻辑，包括用户的创建、查询、更新和删除操作
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * 创建用户
   * @description 根据提供的用户数据创建新用户
   * @param userData 用户数据对象
   * @returns 返回创建的用户信息
   */
  async create(userData: UserData): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  /**
   * 根据邮箱查找用户
   * @description 通过邮箱地址查找用户
   * @param email 用户邮箱地址
   * @returns 返回用户信息，如果不存在则返回null
   */
  async findOne(email: string): Promise<User> {
    return (await this.userModel.findOne({ email })) as User;
  }

  /**
   * 根据ID查找用户
   * @description 通过用户ID查找用户详细信息
   * @param id 用户的唯一标识符
   * @returns 返回用户详细信息
   * @throws {NotFoundException} 当用户不存在时抛出异常
   */
  async findOneById(id: string): Promise<User> {
    const user: User = (await this.userModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 获取用户列表
   * @description 分页获取用户列表，支持按用户名或邮箱搜索
   * @param paginationDto 分页查询参数对象
   * @returns 返回包含用户列表和分页信息的响应对象
   */
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

  /**
   * 更新用户信息
   * @description 根据ID更新用户的基本信息，包括用户名、邮箱和密码
   * @param id 用户的唯一标识符
   * @param updateData 更新数据对象
   * @returns 返回更新后的用户信息
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {BadRequestException} 当邮箱已被其他用户使用时抛出异常
   */
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

  /**
   * 更新用户角色
   * @description 更新指定用户的角色权限
   * @param id 用户的唯一标识符
   * @param role 新的用户角色
   * @returns 返回更新后的用户信息
   * @throws {NotFoundException} 当用户不存在时抛出异常
   */
  async updateRole(id: string, role: string): Promise<User> {
    const user: User = (await this.userModel.findById(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    user.role = role;
    await user.save();
    return user;
  }

  /**
   * 删除用户
   * @description 根据ID删除指定用户
   * @param id 用户的唯一标识符
   * @returns void
   * @throws {NotFoundException} 当用户不存在时抛出异常
   */
  async remove(id: string): Promise<void> {
    const user: User = (await this.userModel.findByIdAndDelete(id)) as User;
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
  }
}
