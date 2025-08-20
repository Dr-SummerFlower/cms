import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefundTicketDto {
  @ApiProperty({
    description: '退票原因（最多500字符）',
    example: '临时有事无法参加',
  })
  @IsString({ message: '退票原因必须是字符串' })
  @IsNotEmpty({ message: '退票原因不能为空' })
  @MaxLength(500, { message: '退票原因最多500个字符' })
  reason: string;
}
