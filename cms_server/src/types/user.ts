export interface UserData {
  username: string;
  avatar: string;
  email: string;
  password: string;
}

export interface UpdateData {
  username?: string;
  email?: string;
  password?: string;
  newPassword?: string;
}
