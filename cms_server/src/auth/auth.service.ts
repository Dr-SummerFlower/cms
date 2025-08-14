import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthResponse, IUserInfo, JwtPayload, TokenResponse } from '../types';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

/**
 * 认证服务
 * @class AuthService
 * @description 处理用户认证相关业务逻辑，包括登录、注册、令牌生成和验证
 */
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 用户登录
   * @param {LoginDto} dto - 登录数据传输对象
   * @returns {Promise<AuthResponse>} 包含访问令牌、刷新令牌和用户信息的响应
   * @throws {BadRequestException} 当用户名或密码错误时抛出
   * @description 验证用户邮箱和密码，成功后生成JWT令牌
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { email, password } = dto;
    const user: User = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('用户名或密码错误');
    }
    const isPwdValid: boolean = await bcrypt.compare(password, user.password);
    if (!isPwdValid) {
      throw new BadRequestException('用户名或密码错误');
    }

    const id: string = String(user.id);
    const payload: JwtPayload = {
      sub: id,
      username: user.username,
    };
    const tokens = await this.generateToken(payload);

    const userInfo: IUserInfo = {
      userId: id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };

    return {
      ...tokens,
      user: userInfo,
    };
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱地址
   * @param {string} userData.password - 密码
   * @param {string} userData.avatar - 用户头像（可选）
   * @returns {Promise<AuthResponse>} 包含访问令牌、刷新令牌和用户信息的响应
   * @throws {ConflictException} 当邮箱已被注册时抛出
   * @throws {InternalServerErrorException} 当注册过程中发生错误时抛出
   * @description 创建新用户账户并生成JWT令牌
   */
  async register(userData: {
    username: string;
    avatar: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const existingUser: User = await this.usersService.findOne(userData.email);
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    try {
      const user: User = await this.usersService.create({
        username: userData.username,
        avatar: userData.avatar,
        email: userData.email,
        password: userData.password,
      });

      const id: string = String(user.id);
      const payload: JwtPayload = {
        sub: id,
        username: user.username,
      };
      const tokens = await this.generateToken(payload);

      const userInfo: IUserInfo = {
        userId: id,
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        role: user.role,
      };

      return {
        ...tokens,
        user: userInfo,
      };
    } catch {
      throw new InternalServerErrorException('用户注册失败，请稍后重试');
    }
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<TokenResponse>} 新的访问令牌和刷新令牌
   * @throws {UnauthorizedException} 当刷新令牌无效或用户不存在时抛出
   * @description 使用刷新令牌生成新的访问令牌和刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const payload: JwtPayload = await this.validateRefreshToken(refreshToken);
    try {
      const user: User = await this.usersService.findOneById(payload.sub);

      const newPayload: JwtPayload = {
        sub: payload.sub,
        username: user.username,
      };

      return this.generateToken(newPayload);
    } catch (error) {
      throw new UnauthorizedException('用户不存在或令牌无效');
    }
  }

  /**
   * 验证刷新令牌
   * @param {string} refreshToken - 刷新令牌
   * @returns {Promise<JwtPayload>} JWT载荷信息
   * @throws {UnauthorizedException} 当刷新令牌无效时抛出
   * @description 验证刷新令牌的有效性并返回载荷信息
   */
  async validateRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const refreshSecret: string = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        this.configService.get<string>('JWT_SECRET', 'qwerty'),
      );
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('无效的refresh token');
    }
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - JWT载荷
   * @param {string} payload.sub - 用户ID
   * @param {string} payload.username - 用户名
   * @returns {Promise<TokenResponse>} 包含访问令牌和刷新令牌的响应
   * @private
   * @description 生成访问令牌和刷新令牌
   */
  private async generateToken(payload: {
    sub: string;
    username: string;
  }): Promise<TokenResponse> {
    const refreshSecret: string = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_SECRET', 'qwerty'),
    );

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      }),
    ]);

    return { access_token, refresh_token };
  }
}
