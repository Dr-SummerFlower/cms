import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserInfo } from '../../types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 根据 `@Roles` 元数据校验当前用户角色的守卫。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * 判断当前请求用户是否拥有访问处理器所需的角色。
   *
   * @param context - Nest 请求执行上下文
   * @returns 当用户角色满足要求时返回 `true`
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: string[] = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user }: { user: IUserInfo } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // 只要当前用户角色命中任一要求角色，即允许继续进入具体业务处理。
    return requiredRoles.some((role: string): boolean => user.role === role);
  }
}
