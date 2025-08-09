import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT认证守卫
 * @class JwtAuthGuard
 * @extends {AuthGuard}
 * @description 基于JWT策略的认证守卫，用于保护需要身份验证的路由
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
