import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Concert } from '../../concerts/entities/concert.entity';
import { TicketStatus, TicketType } from '../../types';
import { User } from '../../users/entities/user.entity';

/**
 * 票据实体，对应用户购买后的单张票信息。
 */
@Schema({
  timestamps: true,
})
export class Ticket extends Document {
  /** 所属演唱会。 */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Concert', required: true })
  concert: Concert;

  /** 购票用户。 */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  /** 票据类型。 */
  @Prop({ enum: ['adult', 'child'], required: true })
  type: TicketType;

  /** 票面价格。 */
  @Prop({ required: true })
  price: number;

  /** 票据当前状态。 */
  @Prop({ enum: ['valid', 'used', 'refunded'], default: 'valid' })
  status: TicketStatus;

  /** 票据签名。 */
  @Prop({ required: true })
  signature: string;

  /** 用于验签的公钥。 */
  @Prop({ required: true })
  publicKey: string;

  /** 写入二维码的原始数据。 */
  @Prop()
  qrCodeData: string;

  /** 退票原因。 */
  @Prop()
  refundReason: string;

  /** 实名购票对应的人脸图片地址。 */
  @Prop()
  faceImage: string;

  /** 购票实名。 */
  @Prop()
  realName: string;

  /** 购票身份证号。 */
  @Prop()
  idCard: string;

  /** 创建时间。 */
  @Prop()
  createdAt: Date;

  /** 最后更新时间。 */
  @Prop()
  updatedAt: Date;
}

/** 票据文档类型。 */
export type TicketDocument = Ticket & Document;

/** 票据实体对应的 Mongoose Schema。 */
export const TicketSchema = SchemaFactory.createForClass(Ticket);
