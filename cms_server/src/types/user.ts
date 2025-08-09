/**
 * @interface
 * @property {string} username - 用户名
 * @property {string} email - 邮箱
 * @property {string} password - 密码
 */
export interface UserData {
  username: string;
  email: string;
  password: string;
}

/**
 *  @interface
 *  @property {string} username - 用户名
 *  @property {string} email - 邮箱
 *  @property {string} password - 密码
 */
export interface UpdateData {
  username?: string;
  email?: string;
  password?: string;
}