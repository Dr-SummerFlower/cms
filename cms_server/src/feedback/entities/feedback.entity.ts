import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Feedback extends Document {
  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  errorType: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: false })
  stack?: string;

  @Prop({ required: false })
  routeStatus?: number;

  @Prop({ required: false })
  routeStatusText?: string;

  @Prop({ required: false })
  routeData?: string;

  @Prop({ default: 'pending', enum: ['pending', 'resolved', 'ignored'] })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type FeedbackDocument = Feedback & Document;

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
