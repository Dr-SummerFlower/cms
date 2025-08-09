import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../types';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

/**
 * JWT刷新令牌策略
 * @class JwtRefreshStrategy
 * @extends {PassportStrategy}
 * @description JWT刷新令牌验证策略，用于验证刷新令牌并提取用户信息
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  /**
   * 构造函数
   * @param {ConfigService} configService - 配置服务
   * @param {UsersService} usersService - 用户服务
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'qwerty'),
    });
  }

  /**
   * 验证JWT刷新令牌载荷
   * @async
   * @param {JwtPayload} payload - JWT载荷数据
   * @returns {Promise<JwtPayload>} 验证后的载荷数据
   * @throws {UnauthorizedException} 用户不存在时抛出异常
   * @description 验证刷新令牌中的用户信息是否有效
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user: User = await this.usersService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return {
      sub: payload.sub,
      username: payload.username,
    };
  }
}
