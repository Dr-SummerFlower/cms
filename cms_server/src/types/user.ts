/**
 * 创建用户时所需的基础数据。
 *
 * @category Model
 */
export interface UserData {
  /** 用户名。 */
  username: string;
  /** 头像地址。 */
  avatar: string;
  /** 邮箱。 */
  email: string;
  /** 密码。 */
  password: string;
}

/**
 * 更新用户资料时允许提交的数据。
 *
 * @category Model
 */
export interface UpdateData {
  /** 新用户名。 */
  username?: string;
  /** 新邮箱。 */
  email?: string;
  /** 旧密码。 */
  password?: string;
  /** 新密码。 */
  newPassword?: string;
}
