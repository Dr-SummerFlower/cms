import type {AuthPayload, CaptchaResult, LoginDto, RefreshDto, RegisterDto, SendCodeDto, Tokens, User,} from "../types";
import http, {postForm, postJson} from "../utils/http";
import {toUser} from "./_transform.ts";

export type AuthResult = {
  access_token: string;
  refresh_token: string;
  user: User;
};

/**
 * 获取验证码图片
 * @returns 返回验证码ID和图片二进制数据
 */
export async function getCaptcha(): Promise<CaptchaResult> {
  const resp = await http.get("/auth/captcha", {
    responseType: "arraybuffer",
  });
  // 响应头可能被转换为小写，所以检查两种可能
  const captchaId = (resp.headers["x-captcha-id"] ||
    resp.headers["X-Captcha-Id"]) as string;
  if (!captchaId) {
    throw new Error("未能获取验证码ID");
  }
  return {
    id: captchaId,
    image: resp.data as ArrayBuffer,
  };
}

export async function login(dto: LoginDto): Promise<AuthResult> {
  const payload = await postJson<AuthPayload, LoginDto>("/auth/login", dto);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    user: toUser(payload.user),
  };
}

export async function register(
  dto: RegisterDto,
  avatar: File | undefined,
): Promise<AuthResult> {
  const form = new FormData();
  form.set("username", dto.username);
  form.set("email", dto.email);
  form.set("password", dto.password);
  form.set("code", dto.code);
  if (avatar) form.set("avatar", avatar);
  const payload = await postForm<AuthPayload>("/auth/register", form);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    user: toUser(payload.user),
  };
}

export async function refresh(refresh_token: string): Promise<Tokens> {
  return await postJson<Tokens, RefreshDto>("/auth/refresh", { refresh_token });
}

export async function sendEmailCode(
  email: string,
  type: "register" | "update",
): Promise<void> {
  await postJson<unknown, SendCodeDto>("/email", { email, type });
}
