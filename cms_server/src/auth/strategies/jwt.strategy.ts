import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserInfo, JwtPayload } from '../../types';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

/**
 * 解析并校验访问令牌的 Passport JWT 策略。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'qwerty'),
    });
  }

  /**
   * 根据 JWT 载荷加载当前用户信息。
   *
   * @param payload - JWT 中携带的用户载荷
   * @returns 注入到请求对象中的用户信息
   * @throws UnauthorizedException 当用户不存在或令牌无效时抛出
   */
  async validate(payload: JwtPayload): Promise<IUserInfo> {
    try {
      const user: User = await this.usersService.findOneById(payload.sub);

      // 每次请求都回库取一次用户信息，避免角色、头像、邮箱等资料长期滞留在旧 token 中。
      return {
        userId: String(user._id),
        username: user.username,
        avatar: user.avatar,
        email: user.email,
        role: user.role,
      };
    } catch {
      throw new UnauthorizedException('用户不存在或令牌无效');
    }
  }
}
