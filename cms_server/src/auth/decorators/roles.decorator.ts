import { SetMetadata } from '@nestjs/common';

/**
 * 角色元数据键名
 * @constant {string}
 */
export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * @function Roles
 * @param {...string[]} roles - 允许访问的角色列表
 * @returns {MethodDecorator} 返回设置角色元数据的装饰器
 * @description 用于标记需要特定角色才能访问的方法或类
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
