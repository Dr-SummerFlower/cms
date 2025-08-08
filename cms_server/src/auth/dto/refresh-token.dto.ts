import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'refresh token不能为空' })
  @IsString({ message: 'refresh token必须是字符串' })
  refresh_token: string;
}
