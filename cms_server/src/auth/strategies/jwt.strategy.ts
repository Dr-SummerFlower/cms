import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserInfo, JwtPayload } from '../../types';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

/**
 * JWT认证策略
 * @class JwtStrategy
 * @extends {PassportStrategy}
 * @description JWT令牌验证策略，用于验证访问令牌并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * 构造函数
   * @param {ConfigService} config - 配置服务
   * @param {UsersService} usersService - 用户服务
   */
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'qwerty'),
    });
  }

  /**
   * 验证JWT载荷
   * @async
   * @param {JwtPayload} payload - JWT载荷数据
   * @returns {Promise<IUserInfo>} 用户信息
   * @description 根据JWT载荷中的用户ID查找用户并返回用户信息
   */
  async validate(payload: JwtPayload): Promise<IUserInfo> {
    const user: User = await this.usersService.findOneById(payload.sub);
    return {
      userId: String(user._id),
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }
}
