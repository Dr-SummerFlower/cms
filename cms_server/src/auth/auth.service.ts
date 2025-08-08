import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { JwtPayload, TokenResponse } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponse> {
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
    return this.generateToken(payload);
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<TokenResponse> {
    const existingUser: User = await this.usersService.findOne(userData.email);
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    try {
      const user: User = await this.usersService.create({
        username: userData.username,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
      });

      const id: string = String(user.id);
      const payload: JwtPayload = {
        sub: id,
        username: user.username,
      };
      return this.generateToken(payload);
    } catch {
      throw new InternalServerErrorException('用户注册失败，请稍后重试');
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload: {
        sub: string;
        username: string;
      } = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
      const user: User = await this.usersService.findOneById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      const newPayload: JwtPayload = {
        sub: payload.sub,
        username: user.username,
      };

      return this.generateToken(newPayload);
    } catch {
      throw new UnauthorizedException('无效的refresh token');
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('无效的refresh token');
    }
  }

  private async generateToken(payload: {
    sub: string;
    username: string;
  }): Promise<TokenResponse> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      }),
    ]);

    return { access_token, refresh_token };
  }
}
