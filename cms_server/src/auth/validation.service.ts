import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-redis/client';

@Injectable()
export class ValidationService {
  constructor(@InjectRedis() private readonly redisService: Redis) {}

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

  async clearCode(email: string, type: 'register' | 'update'): Promise<void> {
    const key = `${type}:code:${email}`;
    await this.redisService.del(key);
  }
}
