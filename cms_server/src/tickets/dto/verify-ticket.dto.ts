import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTicketDto {
  @ApiProperty({
    description: '二维码数据（JSON字符串）',
    example:
      '{"ticketId":"TEMP_1755781895118_YOLKLT","signature":"304602210092061dca3017e5637b8e7c1206c9d90769205841dac89a65f4823b5f4e8f9e94022100c2c04cdf952914cfc549a02049c79de176ca31a8f191cc10e9514aa8fced83a3","timestamp":1755781895118}',
  })
  @IsString({ message: '二维码数据必须是字符串' })
  @IsNotEmpty({ message: '二维码数据不能为空' })
  qrData: string;

  @ApiProperty({ description: '验票地点', example: '北京国家体育场 检票口A' })
  @IsString({ message: '验票地点必须是字符串' })
  @IsNotEmpty({ message: '验票地点不能为空' })
  location: string;
}
