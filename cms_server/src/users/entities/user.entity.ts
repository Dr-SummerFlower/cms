import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Document } from 'mongoose';

/**
 * 用户实体类
 * @description 用户数据模型，定义用户的基本信息和权限
 */
@Schema({
  timestamps: true,
})
export class User extends Document {
  /**
   * 用户名
   * @description 用户的唯一标识名称
   */
  @Prop({ required: true, unique: true })
  username: string;

  /**
   * 邮箱地址
   * @description 用户的邮箱地址，用于登录和接收通知
   */
  @Prop({ required: true, unique: true })
  email: string;

  /**
   * 密码
   * @description 用户的加密密码
   */
  @Prop({
    required: true,
    select: false,
    set: function (value: string) {
      return bcrypt.hashSync(value, 10);
    },
  })
  password: string;

  /**
   * 用户角色
   * @description 用户的权限角色，决定用户可以访问的功能
   */
  @Prop({ enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], default: 'USER' })
  role: string;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
