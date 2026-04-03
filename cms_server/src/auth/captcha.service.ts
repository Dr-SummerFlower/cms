import { InjectRedis, Redis } from '@nestjs-redis/client';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as svgCaptcha from 'svg-captcha';
import { CaptchaResult } from '../types';

/**
 * 负责生成、缓存与校验图形验证码的服务。
 * 使用 svg-captcha 生成纯 JS 实现的 SVG 验证码，无需原生依赖，跨平台兼容。
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly CAPTCHA_EXPIRE_SECONDS: number;
  private readonly CAPTCHA_WIDTH: number;
  private readonly CAPTCHA_HEIGHT: number;
  private readonly CAPTCHA_SIZE: number;

  constructor(
    @InjectRedis() private readonly redisService: Redis,
    private readonly configService: ConfigService,
  ) {
    this.CAPTCHA_EXPIRE_SECONDS = Number(
      this.configService.get('CAPTCHA_EXPIRE_SECONDS', 300),
    );
    this.CAPTCHA_WIDTH = Number(this.configService.get('CAPTCHA_WIDTH', 150));
    this.CAPTCHA_HEIGHT = Number(this.configService.get('CAPTCHA_HEIGHT', 47));
    this.CAPTCHA_SIZE = Number(this.configService.get('CAPTCHA_SIZE', 4));
  }

  /**
   * 生成一组新的图形验证码。
   *
   * @returns 包含验证码标识和 SVG 图片字符串的结果
   * @throws InternalServerErrorException 当验证码生成失败时抛出
   */
  async generate(): Promise<CaptchaResult> {
    try {
      const captcha = svgCaptcha.create({
        size: this.CAPTCHA_SIZE,
        width: this.CAPTCHA_WIDTH,
        height: this.CAPTCHA_HEIGHT,
        // 排除易混淆字符，提升用户输入体验。
        ignoreChars: '0O1IlD',
        noise: 3,
        color: true,
        background: '#a9fce0',
      });

      const id: string = randomUUID();

      // 统一转小写后写入 Redis，后续校验时即可自然忽略大小写差异。
      await this.redisService.setEx(
        `captcha:${id}`,
        this.CAPTCHA_EXPIRE_SECONDS,
        captcha.text.toLowerCase(),
      );

      return {
        id,
        svg: captcha.data,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        '生成验证码时发生错误',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('生成验证码失败，请稍后重试');
    }
  }

  /**
   * 校验指定验证码是否正确。
   *
   * @param id - 验证码唯一标识
   * @param code - 用户输入的验证码文本
   * @returns 验证通过时返回 `true`
   */
  async validate(id: string, code: string): Promise<boolean> {
    if (!id || !code) {
      return false;
    }

    try {
      const key = `captcha:${id}`;
      const storedCode: string | null = await this.redisService.get(key);

      if (!storedCode) {
        return false; // 验证码已过期或不存在
      }

      // 验证码采用一次性消费，用过就删，避免同一张图被重复提交。
      await this.redisService.del(key);

      // 输入前后空格和大小写都不影响校验结果。
      return storedCode.toLowerCase() === code.toLowerCase().trim();
    } catch (error) {
      this.logger.error(
        '校验验证码时发生错误',
        error instanceof Error ? error.stack : String(error),
      );
      // Redis 故障时保守返回 false，让用户重新获取验证码，避免绕过校验。
      return false;
    }
  }
}
