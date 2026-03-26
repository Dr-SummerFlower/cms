import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.entity';

/** 实名信息文档类型。 */
export type RealNameDocument = HydratedDocument<RealName>;
/** 身份证件类型。 */
export type IdType = 'ID_CARD' | 'PASSPORT' | 'OTHER';
/** 实名审核状态。 */
export type IdentityStatus = 'pending' | 'verified' | 'rejected';

/**
 * 用户实名信息实体。
 */
@Schema({ timestamps: true })
export class RealName {
  /** 实名记录 ID。 */
  _id: Types.ObjectId;

  /** 真实姓名。 */
  @Prop({ required: true })
  name: string;

  /** 证件类型。 */
  @Prop({ required: true, enum: ['ID_CARD', 'PASSPORT', 'OTHER'] })
  idType: IdType;

  // 只存哈希与后四位：明文绝不入库
  /** 证件号哈希值。 */
  @Prop({ required: true, unique: true, select: false })
  idNumberHash: string;
  /** 证件号后四位。 */
  @Prop({ required: true })
  idNumberLast4: string;

  /** 签发国家或地区。 */
  @Prop() country?: string;
  /** 出生日期。 */
  @Prop() birthday?: Date;
  /** 性别标识。 */
  @Prop() gender?: 'M' | 'F' | 'U';
  /** 联系电话。 */
  @Prop() phone?: string;

  // 人像素材
  /** 原始人脸照片地址。 */
  @Prop() faceImageUrl?: string; // 原始照片（受控访问）
  /** 人脸特征数据。 */
  @Prop() faceFeature?: string; // 向量/模板（base64/JSON），可选

  // 归属提交者
  /** 提交该实名信息的用户。 */
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  owner: Types.ObjectId;

  /** 当前审核状态。 */
  @Prop({
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  })
  status: IdentityStatus;

  /** 审核备注。 */
  @Prop() remark?: string;
}

/** 实名信息实体对应的 Mongoose Schema。 */
export const RealNameSchema = SchemaFactory.createForClass(RealName);
