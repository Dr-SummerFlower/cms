import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthResponse, IUserInfo, JwtPayload, TokenResponse } from '../types';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CaptchaService } from './captcha.service';
import { LoginLimitService } from './login-limit.service';

/**
 * 处理登录、注册与令牌换发的认证服务。
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginLimitService: LoginLimitService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * 校验验证码并完成用户登录。
   *
   * @param dto - 登录请求参数
   * @returns 包含访问令牌、刷新令牌和用户信息的登录结果
   * @throws BadRequestException 当验证码错误或账号密码不匹配时抛出
   */
  async login(dto: {
    email: string;
    password: string;
    captchaId: string;
    captchaCode: string;
  }): Promise<AuthResponse> {
    try {
      const { email, password, captchaId, captchaCode } = dto;

      // 登录第一步先校验图形验证码，尽量在账号查询前拦住自动化撞库请求。
      const isCaptchaValid = await this.captchaService.validate(
        captchaId,
        captchaCode,
      );
      if (!isCaptchaValid) {
        throw new BadRequestException('验证码错误或已过期');
      }

      // 验证码通过后，再检查该邮箱是否正处于限流锁定期。
      await this.loginLimitService.checkLimit(email);

      const user: User = await this.usersService.findOne(email);
      if (!user) {
        // 用户不存在也计入失败次数，避免通过提示差异探测邮箱是否已注册。
        await this.loginLimitService.recordFailure(email);
        throw new BadRequestException('用户名或密码错误');
      }
      const isPwdValid: boolean = await bcrypt.compare(password, user.password);
      if (!isPwdValid) {
        // 密码错误与账号不存在统一反馈，并继续累计失败记录。
        await this.loginLimitService.recordFailure(email);
        throw new BadRequestException('用户名或密码错误');
      }

      // 登录成功后立即清空失败窗口，恢复该邮箱的正常登录状态。
      await this.loginLimitService.clearFailure(email);

      const id: string = String(user.id);
      const payload: JwtPayload = {
        sub: id,
        username: user.username,
      };
      // 登录成功后同时签发访问令牌与刷新令牌，供前端建立登录态。
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('用户登录时发生系统错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('登录失败，请稍后重试');
    }
  }

  /**
   * 注册新用户并在成功后直接签发令牌。
   *
   * @param userData - 注册所需的用户信息
   * @returns 包含访问令牌、刷新令牌和用户信息的注册结果
   * @throws ConflictException 当邮箱已被注册时抛出
   */
  async register(userData: {
    username: string;
    avatar: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      const existingUser: User = await this.usersService.findOne(userData.email);
      if (existingUser) {
        throw new ConflictException('该邮箱已被注册');
      }

      // 注册成功后直接创建用户，不再要求用户额外走一次登录流程。
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
      // 注册完成立即签发令牌，让前端可以自动进入已登录状态。
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('用户注册时发生系统错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('用户注册失败，请稍后重试');
    }
  }

  /**
   * 使用刷新令牌换发新的访问令牌与刷新令牌。
   *
   * @param refreshToken - 客户端持有的刷新令牌
   * @returns 新的一组访问令牌与刷新令牌
   * @throws UnauthorizedException 当刷新令牌无效或用户不存在时抛出
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const payload: JwtPayload = await this.validateRefreshToken(refreshToken);
    try {
      const user: User = await this.usersService.findOneById(payload.sub);

      // 重新从数据库读取用户名，避免使用过期的载荷信息签发新令牌。
      const newPayload: JwtPayload = {
        sub: payload.sub,
        username: user.username,
      };

      return this.generateToken(newPayload);
    } catch (error) {
      if (error instanceof HttpException) {
        // 刷新令牌场景下所有 HTTP 异常统一映射为 401，避免通过响应差异暴露内部状态。
        throw new UnauthorizedException('用户不存在或令牌无效');
      }
      this.logger.error('刷新令牌时发生系统错误', error instanceof Error ? error.stack : String(error));
      throw new UnauthorizedException('用户不存在或令牌无效');
    }
  }

  /**
   * 校验刷新令牌并解析出载荷。
   *
   * @param refreshToken - 待校验的刷新令牌
   * @returns 刷新令牌中的用户载荷
   * @throws UnauthorizedException 当令牌校验失败时抛出
   */
  async validateRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      // 刷新令牌可使用独立密钥；若未配置，则回退到主 JWT 密钥。
      const refreshSecret: string = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        this.configService.get<string>('JWT_SECRET', 'qwerty'),
      );
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch (error) {
      // 令牌校验失败属于预期内的安全事件，使用 warn 级别而非 error。
      this.logger.warn(
        'Refresh token 校验失败',
        error instanceof Error ? error.message : String(error),
      );
      throw new UnauthorizedException('无效的refresh token');
    }
  }

  /**
   * 为指定用户载荷生成访问令牌与刷新令牌。
   *
   * @param payload - 写入 JWT 的最小必要用户信息
   * @returns 新生成的一组令牌
   */
  private async generateToken(payload: {
    sub: string;
    username: string;
  }): Promise<TokenResponse> {
    const refreshSecret: string = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      this.configService.get<string>('JWT_SECRET', 'qwerty'),
    );

    // 访问令牌负责接口鉴权，刷新令牌负责静默续期；两者并行签发减少响应耗时。
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
