import { InjectRedis, Redis } from '@nestjs-redis/client';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LockData {
  type: string;
  until: number;
}

@Injectable()
export class LoginLimitService {
  private readonly SHORT_WINDOW_SECONDS: number; // 登录失败尝试的窗口时间（秒）
  private readonly SHORT_MAX_ATTEMPTS: number; // 登录失败尝试的次数限制
  private readonly SHORT_LOCK_SECONDS: number; // 登录失败尝试的锁定时间（秒）
  private readonly LONG_WINDOW_SECONDS: number; // 登录失败尝试的窗口时间（秒）
  private readonly LONG_MAX_ATTEMPTS: number; // 登录失败尝试的次数限制
  private readonly LONG_LOCK_SECONDS: number; // 登录失败尝试的锁定时间（秒）

  constructor(
    @InjectRedis() private readonly redisService: Redis,
    private readonly configService: ConfigService,
  ) {
    this.SHORT_WINDOW_SECONDS = this.configService.get<number>(
      'LOGIN_LIMIT_SHORT_WINDOW_SECONDS',
      30,
    );
    this.SHORT_MAX_ATTEMPTS = this.configService.get<number>(
      'LOGIN_LIMIT_SHORT_MAX_ATTEMPTS',
      5,
    );
    this.SHORT_LOCK_SECONDS = this.configService.get<number>(
      'LOGIN_LIMIT_SHORT_LOCK_SECONDS',
      60,
    );
    this.LONG_WINDOW_SECONDS = this.configService.get<number>(
      'LOGIN_LIMIT_LONG_WINDOW_SECONDS',
      300,
    );
    this.LONG_MAX_ATTEMPTS = this.configService.get<number>(
      'LOGIN_LIMIT_LONG_MAX_ATTEMPTS',
      10,
    );
    this.LONG_LOCK_SECONDS = this.configService.get<number>(
      'LOGIN_LIMIT_LONG_LOCK_SECONDS',
      3600,
    );
  }

  async checkLimit(email: string): Promise<void> {
    const lockKey = `login:lock:${email}`;
    const lockInfo: string | null = await this.redisService.get(lockKey);

    if (lockInfo) {
      const lockData: LockData = JSON.parse(lockInfo) as LockData;
      const now: number = Date.now();

      if (lockData.until > now) {
        const remainingSeconds: number = Math.ceil(
          (lockData.until - now) / 1000,
        );
        throw new HttpException(
          `登录尝试过于频繁，请在 ${remainingSeconds} 秒后重试`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      } else {
        await this.redisService.del(lockKey);
      }
    }
  }

  async recordFailure(email: string): Promise<void> {
    const now: number = Date.now();
    const shortKey = `login:failure:short:${email}`;
    const longKey = `login:failure:long:${email}`;
    const lockKey = `login:lock:${email}`;

    const shortWindowStart: number = now - this.SHORT_WINDOW_SECONDS * 1000;
    const longWindowStart: number = now - this.LONG_WINDOW_SECONDS * 1000;

    await Promise.all([
      this.redisService.lPush(shortKey, String(now)),
      this.redisService.lPush(longKey, String(now)),
    ]);

    await Promise.all([
      this.redisService.expire(shortKey, this.SHORT_WINDOW_SECONDS),
      this.redisService.expire(longKey, this.LONG_WINDOW_SECONDS),
    ]);

    const [shortTimestamps, longTimestamps] = await Promise.all([
      this.redisService.lRange(shortKey, 0, -1),
      this.redisService.lRange(longKey, 0, -1),
    ]);

    const shortValidTimestamps: string[] = shortTimestamps.filter(
      (ts: string): boolean => Number.parseInt(ts, 10) >= shortWindowStart,
    );
    const longValidTimestamps: string[] = longTimestamps.filter(
      (ts: string): boolean => Number.parseInt(ts, 10) >= longWindowStart,
    );

    const shortCount: number = shortValidTimestamps.length;
    const longCount: number = longValidTimestamps.length;

    if (shortCount >= this.SHORT_MAX_ATTEMPTS) {
      const lockUntil: number = now + this.SHORT_LOCK_SECONDS * 1000;
      const lockData: LockData = { type: 'short', until: lockUntil };
      await this.redisService.setEx(
        lockKey,
        this.SHORT_LOCK_SECONDS,
        JSON.stringify(lockData),
      );
    } else if (longCount >= this.LONG_MAX_ATTEMPTS) {
      const lockUntil: number = now + this.LONG_LOCK_SECONDS * 1000;
      const lockData: LockData = { type: 'long', until: lockUntil };
      await this.redisService.setEx(
        lockKey,
        this.LONG_LOCK_SECONDS,
        JSON.stringify(lockData),
      );
    }
  }

  async clearFailure(email: string): Promise<void> {
    const shortKey = `login:failure:short:${email}`;
    const longKey = `login:failure:long:${email}`;
    const lockKey = `login:lock:${email}`;

    await Promise.all([
      this.redisService.del(shortKey),
      this.redisService.del(longKey),
      this.redisService.del(lockKey),
    ]);
  }
}
