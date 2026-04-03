import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { FilterQuery, Model } from 'mongoose';
import { UpdateData, UserData } from '../types';
import { PaginationDto } from './dto/pagination.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { User, UserDocument } from './entities/user.entity';

/**
 * 负责用户创建、查询、更新与角色管理的服务。
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * 创建新用户。
   *
   * @param userData - 创建用户所需的基础信息
   * @returns 新创建的用户实体
   * @throws BadRequestException 当用户数据校验失败时抛出
   * @throws ConflictException 当邮箱已存在时抛出
   */
  async create(userData: UserData): Promise<User> {
    try {
      // 用户创建时的密码加密与字段校验交由 schema / hook 统一处理。
      return (await this.userModel.create(userData)) as User;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { name?: string; code?: number };
      if (err.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      if (err.code === 11000) {
        throw new ConflictException('该邮箱已被注册');
      }
      this.logger.error('创建用户时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('创建用户时发生错误');
    }
  }

  /**
   * 根据邮箱查询用户，并包含密码字段。
   *
   * @param email - 用户邮箱
   * @returns 对应的用户实体
   * @throws BadRequestException 当邮箱格式无效时抛出
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
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('查询用户时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('查询用户时发生错误');
    }
  }

  /**
   * 根据 ID 查询用户详情。
   *
   * @param id - 用户 ID
   * @returns 用户实体
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当用户不存在时抛出
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
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('查询用户详情时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('查询用户详情时发生错误');
    }
  }

  /**
   * 分页查询用户列表。
   *
   * @param paginationDto - 分页与搜索条件
   * @returns 用户列表与分页信息
   * @throws BadRequestException 当分页参数超出允许范围时抛出
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
        // 管理端支持按用户名或邮箱统一搜索用户。
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
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('获取用户列表时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('获取用户列表时发生错误');
    }
  }

  /**
   * 更新用户基础信息或密码。
   *
   * @param id - 用户 ID
   * @param updateData - 可更新的用户数据
   * @returns 更新后的用户实体
   * @throws BadRequestException 当参数非法、邮箱冲突或旧密码错误时抛出
   * @throws NotFoundException 当用户不存在时抛出
   */
  async update(id: string, updateData: UpdateData): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user = (await this.userModel
        .findById(id)
        .select('+password')) as User;
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

        // 邮箱验证码在接口层校验，这里只负责真正写入新的邮箱地址。
        user.email = updateData.email;
      }

      if (updateData.newPassword) {
        if (!updateData.password) {
          throw new BadRequestException('更新密码需要提供旧密码');
        }

        // 修改密码前先校验旧密码，避免越权重置。
        const isOldPasswordValid = await bcrypt.compare(
          updateData.password,
          user.password,
        );
        if (!isOldPasswordValid) {
          throw new BadRequestException('旧密码不正确');
        }

        user.password = updateData.newPassword;
      }

      await user.save();

      // 重新读取一次最新用户数据，避免把带密码字段的实体直接返回给上层。
      const result = await this.userModel.findById(user._id).exec();
      if (!result) {
        throw new InternalServerErrorException('更新后的用户信息未找到');
      }

      return result as User;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { name?: string };
      if (err.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      this.logger.error('更新用户信息时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('更新用户信息时发生错误');
    }
  }

  /**
   * 更新用户角色。
   *
   * @param id - 用户 ID
   * @param role - 新角色
   * @returns 更新后的用户实体
   * @throws BadRequestException 当 ID 或角色无效时抛出
   * @throws NotFoundException 当用户不存在时抛出
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

      // 角色会直接影响角色守卫判断，因此修改后立即持久化。
      user.role = role;
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { name?: string };
      if (err.name === 'ValidationError') {
        throw new BadRequestException('用户数据验证失败');
      }
      this.logger.error('更新用户角色时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('更新用户角色时发生错误');
    }
  }

  /**
   * 删除指定用户。
   *
   * @param id - 用户 ID
   * @returns 删除成功时返回 `null`
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当用户不存在时抛出
   */
  async remove(id: string): Promise<null> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }

      const user: User = (await this.userModel.findByIdAndDelete(id)) as User;
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
      // 删除成功后返回 null，让上层按"已删除"处理即可。
      return null;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('删除用户时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('删除用户时发生错误');
    }
  }

  /**
   * 更新用户头像地址。
   *
   * @param id - 用户 ID
   * @param avatarUrl - 新头像地址
   * @returns 更新后的用户实体
   * @throws BadRequestException 当 ID 格式无效时抛出
   * @throws NotFoundException 当用户不存在时抛出
   */
  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('无效的用户ID格式');
      }
      const user = (await this.userModel.findById(id)) as User;
      if (!user) throw new NotFoundException('用户不存在');

      // 头像文件上传由存储服务负责，这里只维护资料中的头像 URL。
      user.avatar = avatarUrl;
      await user.save();
      return user;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('更新用户头像时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('更新用户头像时发生错误');
    }
  }
}
