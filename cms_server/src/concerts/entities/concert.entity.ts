import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Document } from 'mongoose';

/**
 * 演唱会实体，对应 MongoDB 中的演唱会集合。
 */
@Schema({
  timestamps: true,
})
export class Concert extends Document {
  /** 演唱会名称。 */
  @Prop({ required: true })
  name: string;

  /** 演唱会海报地址。 */
  @Prop({ required: true })
  poster: string;

  /** 演唱会开始时间。 */
  @Prop({ required: true })
  date: Date;

  /** 演出场馆。 */
  @Prop({ required: true })
  venue: string;

  /** 成人票价格。 */
  @Prop({ required: true })
  adultPrice: number;

  /** 儿童票价格。 */
  @Prop({ required: true })
  childPrice: number;

  /** 可售总票数。 */
  @Prop({ required: true })
  totalTickets: number;

  /** 已售票数。 */
  @Prop({ default: 0 })
  soldTickets: number;

  /** 单个用户可购买的成人票上限。 */
  @Prop({ default: 2 })
  maxAdultTicketsPerUser: number;

  /** 单个用户可购买的儿童票上限。 */
  @Prop({ default: 1 })
  maxChildTicketsPerUser: number;

  /** 演唱会当前状态。 */
  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status: string;

  /** 演唱会详情描述。 */
  @Prop()
  description: string;

  /** 用于票据验签的公开公钥。 */
  @Prop({ required: true })
  publicKey: string;

  /** 用于票据签名的私钥，加密后存储。 */
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
        // 读取文档时自动解密，保持业务层获取到明文私钥。
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
        // 写入数据库前自动加密，降低私钥明文落库的风险。
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

  /** 创建时间。 */
  @Prop()
  createdAt: Date;

  /** 最后更新时间。 */
  @Prop()
  updatedAt: Date;
}

/** 演唱会文档类型。 */
export type ConcertDocument = Concert & Document;

/** 演唱会实体对应的 Mongoose Schema。 */
export const ConcertSchema = SchemaFactory.createForClass(Concert);
