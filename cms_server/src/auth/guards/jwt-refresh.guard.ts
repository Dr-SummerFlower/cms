import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT刷新令牌守卫
 * @class JwtRefreshGuard
 * @extends {AuthGuard}
 * @description 基于JWT刷新策略的认证守卫，用于保护刷新令牌的路由
 */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
