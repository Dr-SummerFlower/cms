import { SetMetadata } from '@nestjs/common';

/** 角色元数据在反射系统中的键名。 */
export const ROLES_KEY = 'roles';

/**
 * 为路由处理器或控制器声明允许访问的角色列表。
 *
 * @param roles - 允许访问当前资源的角色集合
 * @returns 供 Nest 反射系统读取的角色元数据装饰器
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
