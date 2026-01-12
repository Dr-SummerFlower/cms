import { InjectRedis, Redis } from '@nestjs-redis/client';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCanvas } from 'canvas';
import { randomUUID } from 'crypto';
import { CaptchaResult } from '../types';

@Injectable()
export class CaptchaService {
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
   * 生成验证码图片和文本
   * @returns 返回验证码ID、图片Buffer和验证码文本
   */
  async generate(): Promise<CaptchaResult> {
    try {
      const code: string = this.generateRandomCode();
      const id: string = randomUUID();

      // 生成图片
      const image: Buffer<ArrayBufferLike> = this.generateImage(code);

      // 存储验证码到Redis，5分钟过期
      await this.redisService.setEx(
        `captcha:${id}`,
        this.CAPTCHA_EXPIRE_SECONDS,
        code.toLowerCase(),
      );

      return {
        id,
        image,
      };
    } catch {
      throw new InternalServerErrorException('生成验证码失败');
    }
  }

  /**
   * 验证验证码
   */
  async validate(id: string, code: string): Promise<boolean> {
    if (!id || !code) {
      return false;
    }

    const key = `captcha:${id}`;
    const storedCode: string | null = await this.redisService.get(key);

    if (!storedCode) {
      return false; // 验证码已过期或不存在
    }

    // 验证后删除验证码（一次性使用）
    await this.redisService.del(key);

    // 不区分大小写比较
    return storedCode.toLowerCase() === code.toLowerCase().trim();
  }

  /**
   * 生成随机验证码字符串
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
   * 生成验证码图片
   */
  private generateImage(code: string): Buffer {
    try {
      const canvas = createCanvas(this.CAPTCHA_WIDTH, this.CAPTCHA_HEIGHT);
      const ctx = canvas.getContext('2d');

      // 绘制背景
      ctx.fillStyle = 'rgba(206, 244, 196)';
      ctx.fillRect(0, 0, this.CAPTCHA_WIDTH, this.CAPTCHA_HEIGHT);

      // 绘制验证码文字
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

      // 绘制干扰线
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
      if (error instanceof Error && error.message.includes('canvas')) {
        throw new InternalServerErrorException(
          '验证码生成功能需要安装canvas库，请运行: npm install canvas',
        );
      }
      throw error;
    }
  }

  /**
   * 生成随机数
   */
  private randomNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  /**
   * 生成随机颜色
   */
  private randomColor(min: number, max: number): string {
    const r = this.randomNum(min, max);
    const g = this.randomNum(min, max);
    const b = this.randomNum(min, max);
    return `rgb(${r},${g},${b})`;
  }
}
