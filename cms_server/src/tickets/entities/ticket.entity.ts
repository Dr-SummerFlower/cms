import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Concert } from '../../concerts/entities/concert.entity';
import { TicketStatus, TicketType } from '../../types';
import { User } from '../../users/entities/user.entity';

/**
 * 票据实体类
 * @description 定义票据的数据模型，包含票据的基本信息、状态和安全相关字段
 */
@Schema({
  timestamps: true,
})
export class Ticket extends Document {
  /**
   * 关联的演唱会
   * @description 票据所属的演唱会信息
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Concert', required: true })
  concert: Concert;

  /**
   * 关联的用户
   * @description 票据的持有者
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  /**
   * 票据类型
   * @description 票据的类型，成人票或儿童票
   */
  @Prop({ enum: ['adult', 'child'], required: true })
  type: TicketType;

  /**
   * 票据价格
   * @description 票据的购买价格
   */
  @Prop({ required: true })
  price: number;

  /**
   * 票据状态
   * @description 票据的当前状态：有效、已使用或已退票
   */
  @Prop({ enum: ['valid', 'used', 'refunded'], default: 'valid' })
  status: TicketStatus;

  /**
   * 数字签名
   * @description 票据的数字签名，用于验证票据真实性
   */
  @Prop({ required: true })
  signature: string;

  /**
   * 公钥
   * @description 用于验证数字签名的公钥
   */
  @Prop({ required: true })
  publicKey: string;

  /**
   * 二维码数据
   * @type {string}
   * @description 票据的二维码字符串数据
   */
  @Prop()
  qrCodeData: string;

  /**
   * 退票原因
   * @type {string}
   * @description 当票据被退票时记录的原因
   */
  @Prop()
  refundReason: string;
}

export type TicketDocument = Ticket & Document;

export const TicketSchema = SchemaFactory.createForClass(Ticket);
