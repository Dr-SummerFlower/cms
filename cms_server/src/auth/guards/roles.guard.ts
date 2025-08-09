import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IUserInfo } from '../../types';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色权限守卫
 * @class RolesGuard
 * @implements {CanActivate}
 * @description 基于用户角色的权限控制守卫，检查用户是否具有访问特定资源的角色权限
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * 构造函数
   * @param {Reflector} reflector - NestJS反射器，用于获取元数据
   */
  constructor(private reflector: Reflector) {}

  /**
   * 检查是否允许激活
   * @param {ExecutionContext} context - 执行上下文
   * @returns {boolean} 是否允许访问
   * @description 检查当前用户角色是否匹配所需角色
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

    return requiredRoles.some((role: string): boolean => user.role === role);
  }
}
