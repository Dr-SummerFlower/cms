import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserInfo, JwtPayload } from '../../types';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';

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

  async validate(payload: JwtPayload): Promise<IUserInfo> {
    try {
      const user: User = await this.usersService.findOneById(payload.sub);
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
