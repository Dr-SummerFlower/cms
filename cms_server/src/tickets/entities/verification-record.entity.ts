import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Ticket } from './ticket.entity';

/**
 * 验证记录实体类
 * @description 定义票据验证记录的数据模型，记录每次验票操作的详细信息
 */
@Schema({
  timestamps: true,
})
export class VerificationRecord extends Document {
  /**
   * 关联的票据
   * @type {Ticket}
   * @description 被验证的票据信息
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: Ticket;

  /**
   * 检票员
   * @type {User}
   * @description 执行验票操作的检票员
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  inspector: User;

  /**
   * 验票地点
   * @type {string}
   * @description 进行验票操作的地点
   */
  @Prop({ required: true })
  location: string;

  /**
   * 验证时间
   * @type {Date}
   * @description 验票操作的执行时间
   */
  @Prop({ default: Date.now })
  verifiedAt: Date;

  /**
   * 数字签名
   * @type {string}
   * @description 票据的数字签名
   */
  @Prop({ required: true })
  signature: string;

  /**
   * 验证结果
   * @type {boolean}
   * @description 验票操作的结果，true表示验证通过，false表示验证失败
   */
  @Prop({ required: true })
  result: boolean;
}

export type VerificationRecordDocument = VerificationRecord & Document;

export const VerificationRecordSchema =
  SchemaFactory.createForClass(VerificationRecord);
