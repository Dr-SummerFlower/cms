import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    required: true,
    select: false,
    set: function (value: string) {
      return bcrypt.hashSync(value, 10);
    },
  })
  password: string;

  @Prop({ enum: ['GUEST', 'USER', 'ADMIN', 'INSPECTOR'], default: 'USER' })
  role: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
