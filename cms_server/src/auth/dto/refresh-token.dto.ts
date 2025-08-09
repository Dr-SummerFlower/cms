import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 刷新令牌数据传输对象
 * @class RefreshTokenDto
 * @description 定义刷新访问令牌时需要提供的数据结构
 */
export class RefreshTokenDto {
  /**
   * 刷新令牌
   * @type {string}
   * @description 用于刷新访问令牌的刷新令牌
   */
  @IsNotEmpty({ message: 'refresh token不能为空' })
  @IsString({ message: 'refresh token必须是字符串' })
  refresh_token: string;
}
