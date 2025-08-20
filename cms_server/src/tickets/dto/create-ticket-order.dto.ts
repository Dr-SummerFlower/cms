import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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

export class TicketOrderItemDto {
  @ApiProperty({
    description: '票据类型',
    enum: ['adult', 'child'],
    example: 'adult',
  })
  @IsIn(['adult', 'child'], { message: '票据类型必须是adult或child' })
  type: TicketType;

  @ApiProperty({ description: '票据数量(至少1)', example: 1, minimum: 1 })
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? value : num;
  })
  @IsNumber({}, { message: '票据数量必须是数字' })
  @Min(1, { message: '票据数量至少为1' })
  quantity: number;
}

export class CreateTicketOrderDto {
  @ApiProperty({ description: '演唱会ID', example: '66c1234567890abcdef0456' })
  @IsMongoId({ message: '演唱会ID格式不正确' })
  @IsNotEmpty({ message: '演唱会ID不能为空' })
  concertId: string;

  @ApiProperty({
    description: '购买的票据列表',
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
