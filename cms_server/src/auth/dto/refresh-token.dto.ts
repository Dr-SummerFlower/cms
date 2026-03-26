import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 刷新访问令牌接口的请求体数据传输对象。
 */
export class RefreshTokenDto {
  /** 客户端持有的刷新令牌。 */
  @ApiProperty({ description: '刷新令牌', example: 'refresh_token_example' })
  @IsNotEmpty({ message: 'refresh token不能为空' })
  @IsString({ message: 'refresh token必须是字符串' })
  refresh_token: string;
}
