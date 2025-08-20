export interface JwtPayload {
  sub: string;
  username: string;
}

export interface IUserInfo {
  userId: string;
  username: string;
  avatar: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: IUserInfo;
}
