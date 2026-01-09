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
import { LoginLimitService } from './login-limit.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private loginLimitService: LoginLimitService,
  ) {}

  async login(dto: { email: string; password: string }): Promise<AuthResponse> {
    const { email, password } = dto;

    await this.loginLimitService.checkLimit(email);

    const user: User = await this.usersService.findOne(email);
    if (!user) {
      await this.loginLimitService.recordFailure(email);
      throw new BadRequestException('用户名或密码错误');
    }
    const isPwdValid: boolean = await bcrypt.compare(password, user.password);
    if (!isPwdValid) {
      await this.loginLimitService.recordFailure(email);
      throw new BadRequestException('用户名或密码错误');
    }

    await this.loginLimitService.clearFailure(email);

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
