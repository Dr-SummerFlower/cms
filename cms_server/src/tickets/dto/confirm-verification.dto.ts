import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

/**
 * 人工确认验票接口的请求体数据传输对象。
 */
export class ConfirmVerificationDto {
  /** 待确认验票的票据 ID。 */
  @ApiProperty({
    description: '票据ID',
    example: '66d111111111111111111111',
  })
  @IsMongoId({ message: '票据ID格式不正确' })
  @IsNotEmpty({ message: '票据ID不能为空' })
  ticketId: string;
}
