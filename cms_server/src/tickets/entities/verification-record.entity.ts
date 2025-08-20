import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/entities/user.entity';
import { Ticket } from './ticket.entity';

@Schema({
  timestamps: true,
})
export class VerificationRecord extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: Ticket;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  inspector: User;

  @Prop({ required: true })
  location: string;

  @Prop({ default: Date.now })
  verifiedAt: Date;

  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  result: boolean;
}

export type VerificationRecordDocument = VerificationRecord & Document;

export const VerificationRecordSchema =
  SchemaFactory.createForClass(VerificationRecord);
