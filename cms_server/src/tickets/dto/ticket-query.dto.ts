import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';
import { TicketStatus } from '../../types';

export class TicketQueryDto {
  @ApiProperty({
    description: '票据状态（可选）',
    required: false,
    enum: ['valid', 'used', 'refunded'],
    example: 'valid',
  })
  @IsOptional()
  @IsIn(['valid', 'used', 'refunded'], {
    message: '票据状态必须是valid、used或refunded',
  })
  status?: TicketStatus;

  @ApiProperty({
    description: '演唱会ID（可选）',
    required: false,
    example: '66c1234567890abcdef0456',
  })
  @IsOptional()
  @IsMongoId({ message: '演唱会ID格式不正确' })
  concertId?: string;
}
