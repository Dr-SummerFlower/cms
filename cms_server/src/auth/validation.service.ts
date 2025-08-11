import { InjectRedis, Redis } from '@nestjs-redis/client';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

/**
 * 验证码验证服务
 * @class ValidationService
 * @description 提供验证码验证和清理功能
 */
@Injectable()
export class ValidationService {
  /**
   * 构造函数
   * @param {Redis} redisService - Redis客户端服务
   */
  constructor(@InjectRedis() private readonly redisService: Redis) {}

  /**
   * 验证邮箱验证码
   * @async
   * @param {string} email - 邮箱地址
   * @param {string} code - 验证码
   * @param {'register' | 'update'} type - 验证码类型
   * @returns {Promise<void>}
   * @throws {BadRequestException} 验证码过期、不存在、错误或参数无效时抛出异常
   * @throws {InternalServerErrorException} 当Redis操作失败时抛出
   */
  async validateCode(
    email: string,
    code: string,
    type: 'register' | 'update',
  ): Promise<void> {
    try {
      if (!email || !email.includes('@')) {
        throw new BadRequestException('无效的邮箱格式');
      }

      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        throw new BadRequestException('验证码必须是6位数字');
      }

      if (!['register', 'update'].includes(type)) {
        throw new BadRequestException('无效的验证码类型');
      }

      const key = `${type}:code:${email}`;
      const storedCode: string | null = await this.redisService.get(key);

      if (!storedCode) {
        throw new BadRequestException('验证码已过期或不存在');
      }

      if (storedCode !== code) {
        throw new BadRequestException('验证码错误');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('验证码验证时发生错误');
    }
  }

  /**
   * 清除邮箱验证码
   * @async
   * @param {string} email - 邮箱地址
   * @param {'register' | 'update'} type - 验证码类型
   * @returns {Promise<void>}
   * @throws {BadRequestException} 当参数无效时抛出
   * @throws {InternalServerErrorException} 当Redis操作失败时抛出
   */
  async clearCode(email: string, type: 'register' | 'update'): Promise<void> {
    try {
      if (!email || !email.includes('@')) {
        throw new BadRequestException('无效的邮箱格式');
      }

      if (!['register', 'update'].includes(type)) {
        throw new BadRequestException('无效的验证码类型');
      }

      const key = `${type}:code:${email}`;
      await this.redisService.del(key);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('清除验证码时发生错误');
    }
  }
}
