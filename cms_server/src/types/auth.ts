/**
 * @interface
 * @property {string} sub - 用户id
 * @property {string} username - 用户名
 */
export interface JwtPayload {
  sub: string;
  username: string;
}

/**
 * @interface
 * @property {string} userId - 用户id
 * @property {string} username - 用户名
 * @property {string} avatar - 用户头像
 * @property {string} email - 邮箱
 * @property {string} role - 角色
 */
export interface IUserInfo {
  userId: string;
  username: string;
  avatar: string;
  email: string;
  role: string;
}

/**
 * @interface
 * @property {string} access_token - 访问令牌
 * @property {string} refresh_token - 刷新令牌
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * @interface
 * @property {string} access_token - 访问令牌
 * @property {string} refresh_token - 刷新令牌
 * @property {IUserInfo} user - 用户信息
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: IUserInfo;
}
