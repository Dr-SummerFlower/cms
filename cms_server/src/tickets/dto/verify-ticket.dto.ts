import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 验票数据传输对象
 * @description 定义验票操作所需的数据结构
 */
export class VerifyTicketDto {
  /**
   * 二维码数据
   * @type {string}
   * @description 票据的二维码字符串数据
   */
  @ApiProperty({
    description: '二维码数据',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: '二维码数据必须是字符串' })
  @IsNotEmpty({ message: '二维码数据不能为空' })
  qrData: string;

  /**
   * 验票地点
   * @type {string}
   * @description 进行验票操作的地点
   */
  @ApiProperty({
    description: '验票地点',
    example: '北京鸟巢体育场入口A',
  })
  @IsString({ message: '验票地点必须是字符串' })
  @IsNotEmpty({ message: '验票地点不能为空' })
  location: string;
}
