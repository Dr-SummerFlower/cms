import { InjectRedis, Redis } from '@nestjs-redis/client';
import { BadRequestException, Injectable } from '@nestjs/common';

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
   * @throws {BadRequestException} 验证码过期、不存在或错误时抛出异常
   */
  async validateCode(
    email: string,
    code: string,
    type: 'register' | 'update',
  ): Promise<void> {
    const key = `${type}:code:${email}`;
    const storedCode: string | null = await this.redisService.get(key);

    if (!storedCode) {
      throw new BadRequestException('验证码已过期或不存在');
    }

    if (storedCode !== code) {
      throw new BadRequestException('验证码错误');
    }
  }

  /**
   * 清除邮箱验证码
   * @async
   * @param {string} email - 邮箱地址
   * @param {'register' | 'update'} type - 验证码类型
   * @returns {Promise<void>}
   */
  async clearCode(email: string, type: 'register' | 'update'): Promise<void> {
    const key = `${type}:code:${email}`;
    await this.redisService.del(key);
  }
}
