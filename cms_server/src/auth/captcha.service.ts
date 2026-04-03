import { InjectRedis, Redis } from '@nestjs-redis/client';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCanvas } from 'canvas';
import { randomUUID } from 'crypto';
import { CaptchaResult } from '../types';

/**
 * 负责生成、缓存与校验图形验证码的服务。
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
   * @returns 包含验证码标识和图片二进制数据的结果
   * @throws InternalServerErrorException 当验证码生成失败时抛出
   */
  async generate(): Promise<CaptchaResult> {
    try {
      const code: string = this.generateRandomCode();
      const id: string = randomUUID();

      // 前端只拿到验证码图片和 ID，真正答案只保存在服务端缓存里。
      const image: Buffer<ArrayBufferLike> = this.generateImage(code);

      // 统一转小写后写入 Redis，后续校验时即可自然忽略大小写差异。
      await this.redisService.setEx(
        `captcha:${id}`,
        this.CAPTCHA_EXPIRE_SECONDS,
        code.toLowerCase(),
      );

      return {
        id,
        image,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('生成验证码时发生未知错误', error instanceof Error ? error.stack : String(error));
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
      this.logger.error('校验验证码时发生错误', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }

  /**
   * 生成指定长度的随机验证码字符串。
   *
   * @returns 随机验证码文本
   */
  private generateRandomCode(): string {
    const numArr = '0123456789'.split('');
    const letterArr =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const txtArr = numArr.concat(letterArr);

    let code = '';
    for (let i = 0; i < this.CAPTCHA_SIZE; i++) {
      code += txtArr[this.randomNum(0, txtArr.length)];
    }
    return code;
  }

  /**
   * 根据验证码文本绘制 PNG 图片。
   *
   * @param code - 需要绘制到图片中的验证码文本
   * @returns PNG 格式的图片缓冲区
   */
  private generateImage(code: string): Buffer {
    try {
      const canvas = createCanvas(this.CAPTCHA_WIDTH, this.CAPTCHA_HEIGHT);
      const ctx = canvas.getContext('2d');

      // 绘制背景
      ctx.fillStyle = 'rgba(206, 244, 196)';
      ctx.fillRect(0, 0, this.CAPTCHA_WIDTH, this.CAPTCHA_HEIGHT);

      // 每个字符都做随机字号、颜色和旋转，降低 OCR 识别成功率。
      ctx.textBaseline = 'middle';

      for (let i = 0; i < code.length; i++) {
        const txt = code[i];
        ctx.font = `${this.randomNum(this.CAPTCHA_HEIGHT / 2, this.CAPTCHA_HEIGHT)}px SimHei, Arial, sans-serif`;
        ctx.fillStyle = this.randomColor(50, 160);
        ctx.shadowOffsetX = this.randomNum(-3, 3);
        ctx.shadowOffsetY = this.randomNum(-3, 3);
        ctx.shadowBlur = this.randomNum(-3, 3);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';

        const x = (this.CAPTCHA_WIDTH / (code.length + 1)) * (i + 1);
        const y = this.CAPTCHA_HEIGHT / 2;
        const deg = this.randomNum(-30, 30);

        // 设置旋转角度和坐标原点
        ctx.translate(x, y);
        ctx.rotate((deg * Math.PI) / 180);
        ctx.fillText(txt, 0, 0);
        // 恢复旋转角度和坐标原点
        ctx.rotate((-deg * Math.PI) / 180);
        ctx.translate(-x, -y);
      }

      // 额外加入干扰线，进一步增加自动识别成本。
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = this.randomColor(40, 180);
        ctx.beginPath();
        ctx.moveTo(
          this.randomNum(0, this.CAPTCHA_WIDTH),
          this.randomNum(0, this.CAPTCHA_HEIGHT),
        );
        ctx.lineTo(
          this.randomNum(0, this.CAPTCHA_WIDTH),
          this.randomNum(0, this.CAPTCHA_HEIGHT),
        );
        ctx.stroke();
      }

      // 将canvas转换为Buffer
      return canvas.toBuffer('image/png');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('canvas') ||
        message.includes('Cannot find module') ||
        message.includes('NODE_MODULE_VERSION') ||
        message.includes('invalid ELF')
      ) {
        this.logger.error(
          'canvas 原生模块加载失败，请确认系统已安装 libcairo 等依赖并重新编译 canvas',
          error instanceof Error ? error.stack : String(error),
        );
        throw new InternalServerErrorException(
          '验证码图片生成失败：canvas 原生模块不可用，请联系管理员',
        );
      }
      this.logger.error('验证码图片渲染失败', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('验证码图片生成失败，请稍后重试');
    }
  }

  /**
   * 生成指定区间内的随机整数。
   *
   * @param min - 区间下界（含）
   * @param max - 区间上界（不含）
   * @returns 随机整数
   */
  private randomNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  /**
   * 生成指定亮度范围内的随机 RGB 颜色。
   *
   * @param min - 每个颜色通道的最小值
   * @param max - 每个颜色通道的最大值
   * @returns CSS `rgb(...)` 字符串
   */
  private randomColor(min: number, max: number): string {
    const r = this.randomNum(min, max);
    const g = this.randomNum(min, max);
    const b = this.randomNum(min, max);
    return `rgb(${r},${g},${b})`;
  }
}
