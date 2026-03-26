import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Ticket } from './ticket.entity';

/**
 * 验票记录实体，用于保存每次验票行为与结果。
 */
@Schema({
  timestamps: true,
})
export class VerificationRecord extends Document {
  /** 被验证的票据。 */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: Ticket;

  /** 执行验票的检票员。 */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  inspector: User;

  /** 验票地点。 */
  @Prop({ required: true })
  location: string;

  /** 验票时间。 */
  @Prop({ default: Date.now })
  verifiedAt: Date;

  /** 本次验票使用的签名。 */
  @Prop({ required: true })
  signature: string;

  /** 验票结果。 */
  @Prop({ required: true })
  result: boolean;

  /** 创建时间。 */
  @Prop()
  createdAt: Date;

  /** 最后更新时间。 */
  @Prop()
  updatedAt: Date;
}

/** 验票记录文档类型。 */
export type VerificationRecordDocument = VerificationRecord & Document;

/** 验票记录实体对应的 Mongoose Schema。 */
export const VerificationRecordSchema =
  SchemaFactory.createForClass(VerificationRecord);
