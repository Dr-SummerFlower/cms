import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 演唱会实体类
 * @description 演唱会数据模型，定义演唱会的基本信息和状态
 */
@Schema({
  timestamps: true,
})
export class Concert {
  /**
   * 演唱会名称
   * @description 演唱会的标题名称
   */
  @Prop({ required: true })
  name: string;

  /**
   * 演唱会日期
   * @description 演唱会举办的日期和时间
   */
  @Prop({ required: true })
  date: Date;

  /**
   * 演出场馆
   * @description 演唱会举办的地点场馆
   */
  @Prop({ required: true })
  venue: string;

  /**
   * 成人票价格
   * @description 成人票的价格（单位：元）
   */
  @Prop({ required: true })
  adultPrice: number;

  /**
   * 儿童票价格
   * @description 儿童票的价格（单位：元）
   */
  @Prop({ required: true })
  childPrice: number;

  /**
   * 总票数
   * @description 演唱会的总票数
   */
  @Prop({ required: true })
  totalTickets: number;

  /**
   * 已售票数
   * @description 已经售出的票数
   */
  @Prop({ default: 0 })
  soldTickets: number;

  /**
   * 演唱会状态
   * @description 演唱会的当前状态：upcoming(即将开始)、ongoing(进行中)、completed(已完成)
   */
  @Prop({ enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' })
  status: string;

  /**
   * 演唱会描述
   * @description 演唱会的详细描述信息
   */
  @Prop()
  description: string;
}

export type ConcertDocument = Concert & Document;

export const ConcertSchema = SchemaFactory.createForClass(Concert);
