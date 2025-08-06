import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string }> {
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
    const payload = { sub: id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
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
      const payload: { sub: string; username: string } = {
        sub: id,
        username: user.username,
      };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      this.logger.warn(error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('用户注册失败，请稍后重试');
    }
  }
}
