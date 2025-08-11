import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { TicketType } from '../../types';

/**
 * 票据订单项数据传输对象
 * @description 定义单个票据类型的订单项，包含票据类型和数量
 */
export class TicketOrderItemDto {
  /**
   * 票据类型
   * @type {TicketType}
   * @description 票据的类型，成人票或儿童票
   */
  @ApiProperty({
    description: '票据类型',
    enum: ['adult', 'child'],
    example: 'adult',
  })
  @IsIn(['adult', 'child'], { message: '票据类型必须是adult或child' })
  type: TicketType;

  /**
   * 票据数量
   * @type {number}
   * @description 该类型票据的购买数量
   */
  @ApiProperty({
    description: '票据数量',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: '票据数量必须是数字' })
  @Min(1, { message: '票据数量至少为1' })
  quantity: number;
}

/**
 * 创建票据订单数据传输对象
 * @description 定义创建票据订单所需的数据结构，包含演唱会ID和票据列表
 */
export class CreateTicketOrderDto {
  /**
   * 演唱会ID
   * @description 要购买票据的演唱会唯一标识
   */
  @ApiProperty({
    description: '演唱会ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId({ message: '演唱会ID格式不正确' })
  @IsNotEmpty({ message: '演唱会ID不能为空' })
  concertId: string;

  /**
   * 票据列表
   * @description 要购买的票据类型和数量列表
   */
  @ApiProperty({
    description: '票据列表',
    type: [TicketOrderItemDto],
    example: [
      { type: 'adult', quantity: 2 },
      { type: 'child', quantity: 1 },
    ],
  })
  @IsArray({ message: '票据列表必须是数组' })
  @ArrayMinSize(1, { message: '至少需要购买一张票' })
  @ValidateNested({ each: true })
  @Type(() => TicketOrderItemDto)
  tickets: TicketOrderItemDto[];
}
