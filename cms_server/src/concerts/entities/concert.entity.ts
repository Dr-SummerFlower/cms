import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Document } from 'mongoose';

/**
 * 演唱会实体类
 * @description 演唱会数据模型，定义演唱会的基本信息和状态
 */
@Schema({
  timestamps: true,
})
export class Concert extends Document {
  /**
   * 演唱会名称
   * @type {string}
   * @description 演唱会的标题名称
   */
  @Prop({ required: true })
  name: string;

  /**
   * 演唱会日期
   * @type {Date}
   * @description 演唱会举办的日期和时间
   */
  @Prop({ required: true })
  date: Date;

  /**
   * 演出场馆
   * @type {string}
   * @description 演唱会举办的地点场馆
   */
  @Prop({ required: true })
  venue: string;

  /**
   * 成人票价格
   * @type {number}
   * @description 成人票的价格（单位：元）
   */
  @Prop({ required: true })
  adultPrice: number;

  /**
   * 儿童票价格
   * @type {number}
   * @description 儿童票的价格（单位：元）
   */
  @Prop({ required: true })
  childPrice: number;

  /**
   * 总票数
   * @type {number}
   * @description 演唱会的总票数
   */
  @Prop({ required: true })
  totalTickets: number;

  /**
   * 已售票数
   * @type {number}
   * @description 已经售出的票数
   */
  @Prop({ default: 0 })
  soldTickets: number;

  /**
   * 每个用户最多可购买的成人票数量
   * @type {number}
   * @description 单个用户最多可以购买的成人票数量
   */
  @Prop({ default: 2 })
  maxAdultTicketsPerUser: number;

  /**
   * 每个用户最多可购买的儿童票数量
   * @type {number}
   * @description 单个用户最多可以购买的儿童票数量
   */
  @Prop({ default: 1 })
  maxChildTicketsPerUser: number;

  /**
   * 演唱会状态
   * @type {string}
   * @description 演唱会的当前状态：upcoming(即将开始)、ongoing(进行中)、completed(已完成)
   */
  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status: string;

  /**
   * 演唱会描述
   * @type {string}
   * @description 演唱会的详细描述信息
   */
  @Prop()
  description: string;

  /**
   * ECDSA公钥
   * @type {string}
   * @description 用于验证票据签名的公钥
   */
  @Prop({ required: true })
  publicKey: string;

  /**
   * ECDSA私钥
   * @type {string}
   * @description 用于生成票据签名的私钥（加密存储，不会在查询中返回）
   */
  @Prop({
    required: true,
    select: false,
    get: function (value: string) {
      if (!value) return value;
      try {
        const encryptionKey =
          process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
        const parts = value.split(':');
        if (parts.length !== 2) return value;
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        const decipher = createDecipheriv(
          'aes-256-cbc',
          Buffer.from(encryptionKey.slice(0, 32)),
          iv,
        );
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch {
        return value;
      }
    },
    set: function (value: string) {
      if (!value) return value;
      try {
        const encryptionKey =
          process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!';
        const iv = randomBytes(16);
        const cipher = createCipheriv(
          'aes-256-cbc',
          Buffer.from(encryptionKey.slice(0, 32)),
          iv,
        );
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
      } catch {
        return value;
      }
    },
  })
  privateKey: string;
}

export type ConcertDocument = Concert & Document;

export const ConcertSchema = SchemaFactory.createForClass(Concert);
