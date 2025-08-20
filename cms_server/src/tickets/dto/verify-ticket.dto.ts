import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTicketDto {
  @ApiProperty({
    description: '二维码数据（Base64或JSON字符串）',
    example:
      'eyJ0aWNrZXRJZCI6IjY2ZDExMTExMTExMTExMTExMTExMTExMSIsInNpZ25hdHVyZSI6IjMwNDUwMjIxMDBhYmMxMjMiLCJ0aW1lc3RhbXAiOjE3MjQxNTUyMDAwfQ==',
  })
  @IsString({ message: '二维码数据必须是字符串' })
  @IsNotEmpty({ message: '二维码数据不能为空' })
  qrData: string;

  @ApiProperty({ description: '验票地点', example: '北京国家体育场 检票口A' })
  @IsString({ message: '验票地点必须是字符串' })
  @IsNotEmpty({ message: '验票地点不能为空' })
  location: string;
}
