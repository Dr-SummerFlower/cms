import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.entity';

export type RealNameDocument = HydratedDocument<RealName>;
export type IdType = 'ID_CARD' | 'PASSPORT' | 'OTHER';
export type IdentityStatus = 'pending' | 'verified' | 'rejected';

@Schema({ timestamps: true })
export class RealName {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;
  @Prop({ required: true, enum: ['ID_CARD', 'PASSPORT', 'OTHER'] })
  idType: IdType;

  // 只存哈希与后四位：明文绝不入库
  @Prop({ required: true, unique: true, select: false })
  idNumberHash: string;
  @Prop({ required: true })
  idNumberLast4: string;

  @Prop() country?: string;
  @Prop() birthday?: Date;
  @Prop() gender?: 'M' | 'F' | 'U';
  @Prop() phone?: string;

  // 人像素材
  @Prop() faceImageUrl?: string; // 原始照片（受控访问）
  @Prop() faceFeature?: string; // 向量/模板（base64/JSON），可选

  // 归属提交者
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  owner: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  status: IdentityStatus;

  @Prop() remark?: string;
}
export const RealNameSchema = SchemaFactory.createForClass(RealName);
