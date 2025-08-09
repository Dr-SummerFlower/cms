import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Concert {
  // 演唱会名称
  @Prop({ required: true })
  name: string;

  // 演唱会日期
  @Prop({ required: true })
  date: Date;

  // 演唱会地点·
  @Prop({ required: true })
  venue: string;

  // 演唱会价格
  @Prop({ required: true })
  adultPrice: number;

  // 演唱会儿童价格
  @Prop({ required: true })
  childPrice: number;

  // 演唱会总票数
  @Prop({ required: true })
  totalTickets: number;

  // 演唱会已售票数
  @Prop({ default: 0 })
  soldTickets: number;

  // 演唱会状态(待定、进行中、已完成)
  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status: string;

  // 演唱会描述
  @Prop()
  description: string;
}

export type ConcertDocument = Concert & Document;

export const ConcertSchema = SchemaFactory.createForClass(Concert);
