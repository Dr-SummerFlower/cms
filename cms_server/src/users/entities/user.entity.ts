import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Document } from 'mongoose';

/**
 * 用户实体，对应系统中的账户信息。
 */
@Schema({
  timestamps: true,
})
export class User extends Document {
  /** 用户名。 */
  @Prop({ required: true, unique: true })
  username: string;

  /** 用户头像地址。 */
  @Prop({ required: false })
  avatar: string;

  /** 用户邮箱。 */
  @Prop({ required: true, unique: true })
  email: string;

  /** 登录密码，写入数据库前自动哈希。 */
  @Prop({
    required: true,
    select: false,
    set: function (value: string) {
      // 避免明文密码入库，统一在 setter 中完成哈希。
      return bcrypt.hashSync(value, 10);
    },
  })
  password: string;

  /** 用户角色。 */
  @Prop({ enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], default: 'USER' })
  role: string;

  /** 创建时间。 */
  @Prop()
  createdAt: Date;

  /** 最后更新时间。 */
  @Prop()
  updatedAt: Date;
}

/** 用户文档类型。 */
export type UserDocument = User & Document;

/** 用户实体对应的 Mongoose Schema。 */
export const UserSchema = SchemaFactory.createForClass(User);
