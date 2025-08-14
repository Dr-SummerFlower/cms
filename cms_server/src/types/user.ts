/**
 * @interface
 * @property {string} username - 用户名
 * @property {string} avatar - 用户头像（可选）
 * @property {string} email - 邮箱
 * @property {string} password - 密码
 */
export interface UserData {
  username: string;
  avatar: string;
  email: string;
  password: string;
}

/**
 *  @interface
 *  @property {string} username - 用户名
 *  @property {string} avatar - 用户头像
 *  @property {string} email - 邮箱
 *  @property {string} password - 密码
 */
export interface UpdateData {
  username?: string;
  avatar?: string;
  email?: string;
  password?: string;
}
