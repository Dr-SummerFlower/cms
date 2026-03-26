/**
 * JWT 中携带的最小用户载荷。
 *
 * @category Model
 */
export interface JwtPayload {
  /** 用户 ID。 */
  sub: string;
  /** 用户名。 */
  username: string;
}

/**
 * 注入到请求上下文中的当前用户信息。
 *
 * @category Model
 */
export interface IUserInfo {
  /** 用户 ID。 */
  userId: string;
  /** 用户名。 */
  username: string;
  /** 用户头像地址。 */
  avatar: string;
  /** 用户邮箱。 */
  email: string;
  /** 用户角色。 */
  role: string;
}

/**
 * 访问令牌与刷新令牌的返回结构。
 *
 * @category Model
 */
export interface TokenResponse {
  /** 访问令牌。 */
  access_token: string;
  /** 刷新令牌。 */
  refresh_token: string;
}

/**
 * 认证接口的标准成功响应数据。
 *
 * @category Model
 */
export interface AuthResponse {
  /** 访问令牌。 */
  access_token: string;
  /** 刷新令牌。 */
  refresh_token: string;
  /** 当前登录用户信息。 */
  user: IUserInfo;
}

/**
 * 图形验证码生成结果。
 *
 * @category Model
 */
export interface CaptchaResult {
  /** 验证码 ID。 */
  id: string;
  /** 验证码图片二进制内容。 */
  image: Buffer;
}
