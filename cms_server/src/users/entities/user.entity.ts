import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * User模型
 */
@Schema({
  timestamps: true,
})
export class User extends Document {
  // 用户名
  @Prop({ required: true, unique: true })
  username: string;

  // 邮箱
  @Prop({ required: true, unique: true })
  email: string;

  // 密码
  @Prop({ required: true })
  password: string;

  // 权限
  @Prop({ enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], default: 'USER' })
  role: string;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
