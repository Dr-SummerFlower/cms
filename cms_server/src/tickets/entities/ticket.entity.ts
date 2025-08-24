import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Concert } from '../../concerts/entities/concert.entity';
import { TicketStatus, TicketType } from '../../types';
import { User } from '../../users/entities/user.entity';

@Schema({
  timestamps: true,
})
export class Ticket extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Concert', required: true })
  concert: Concert;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ enum: ['adult', 'child'], required: true })
  type: TicketType;

  @Prop({ required: true })
  price: number;

  @Prop({ enum: ['valid', 'used', 'refunded'], default: 'valid' })
  status: TicketStatus;

  @Prop({ required: true })
  signature: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop()
  qrCodeData: string;

  @Prop()
  refundReason: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type TicketDocument = Ticket & Document;

export const TicketSchema = SchemaFactory.createForClass(Ticket);
