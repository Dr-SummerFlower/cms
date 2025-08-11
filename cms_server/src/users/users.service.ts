import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
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
   * @throws {ConflictException} 当邮箱已被使用时抛出
   * @throws {BadRequestException} 当用户数据验证失败时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
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

  /**
   * 根据邮箱查找用户
   * @description 通过邮箱地址查找用户，包含密码字段用于登录验证
   * @param email 用户邮箱地址
   * @returns 返回用户信息，如果不存在则返回null
   * @throws {BadRequestException} 当邮箱格式无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
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

  /**
   * 根据ID查找用户
   * @description 通过用户ID查找用户详细信息
   * @param id 用户的唯一标识符
   * @returns 返回用户详细信息
   * @throws {BadRequestException} 当ID格式无效时抛出
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
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

  /**
   * 获取用户列表
   * @description 分页获取用户列表，支持按用户名或邮箱搜索
   * @param paginationDto 分页查询参数对象
   * @returns 返回包含用户列表和分页信息的响应对象
   * @throws {BadRequestException} 当分页参数无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
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

  /**
   * 更新用户信息
   * @description 根据ID更新用户的基本信息，包括用户名、邮箱和密码
   * @param id 用户的唯一标识符
   * @param updateData 更新数据对象
   * @returns 返回更新后的用户信息
   * @throws {BadRequestException} 当ID格式无效或邮箱已被其他用户使用时抛出异常
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async update(id: string, updateData: UpdateData): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

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

  /**
   * 更新用户角色
   * @description 更新指定用户的角色权限
   * @param id 用户的唯一标识符
   * @param role 新的用户角色
   * @returns 返回更新后的用户信息
   * @throws {BadRequestException} 当ID格式无效或角色无效时抛出
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
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

  /**
   * 删除用户
   * @description 根据ID删除指定用户
   * @param id 用户的唯一标识符
   * @returns void
   * @throws {BadRequestException} 当ID格式无效时抛出
   * @throws {NotFoundException} 当用户不存在时抛出异常
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async remove(id: string): Promise<void> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user: User = (await this.userModel.findByIdAndDelete(id)) as User;
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
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
}
