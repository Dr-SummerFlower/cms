import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌', example: 'refresh_token_example' })
  @IsNotEmpty({ message: 'refresh token不能为空' })
  @IsString({ message: 'refresh token必须是字符串' })
  refresh_token: string;
}
