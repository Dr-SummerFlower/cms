import { InjectRedis, Redis } from '@nestjs-redis/client';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

/**
 * 负责校验并清理邮箱验证码的认证辅助服务。
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(@InjectRedis() private readonly redisService: Redis) {}

  /**
   * 校验指定邮箱下的验证码是否正确且仍在有效期内。
   *
   * @param email - 接收验证码的邮箱地址
   * @param code - 用户提交的 6 位验证码
   * @param type - 验证码用途类型
   * @returns 验证通过时不返回内容
   * @throws BadRequestException 当邮箱、验证码或类型不合法时抛出
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

      // 不同业务类型使用独立 Redis 键，避免注册与资料修改互相覆盖。
      const key = `${type}:code:${email}`;
      const storedCode: string | null = await this.redisService.get(key);

      if (!storedCode) {
        throw new BadRequestException('验证码已过期或不存在');
      }

      // 验证码必须完全匹配，避免不同业务场景下的验证码串用。
      if (storedCode !== code) {
        throw new BadRequestException('验证码错误');
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('验证码验证时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('验证码服务暂时不可用，请稍后重试');
    }
  }

  /**
   * 删除指定邮箱和用途对应的验证码缓存。
   *
   * @param email - 接收验证码的邮箱地址
   * @param type - 验证码用途类型
   * @returns 删除完成时不返回内容
   * @throws BadRequestException 当邮箱或类型不合法时抛出
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
      // 注册或资料修改完成后主动清理验证码，避免后续重复使用。
      await this.redisService.del(key);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('清除验证码时发生错误', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('验证码服务暂时不可用，请稍后重试');
    }
  }
}
