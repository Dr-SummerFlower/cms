import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ConfirmVerificationDto {
  @ApiProperty({
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @IsMongoId({ message: '票据ID格式不正确' })
  @IsNotEmpty({ message: '票据ID不能为空' })
  ticketId: string;
}

