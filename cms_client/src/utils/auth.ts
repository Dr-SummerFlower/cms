import type {Tokens} from '../types';
import {deleteCookie, getCookie, setCookie} from './cookie';

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

// 内存缓存
let memoryTokens: { access_token?: string; refresh_token?: string } = {};

/**
 * 获取 access token
 * 优先级：内存 > sessionStorage > cookie
 */
export function getAccessToken(): string | null {
  // 1. 优先从内存获取
  if (memoryTokens.access_token) {
    return memoryTokens.access_token;
  }

  // 2. 从 sessionStorage 获取
  try {
    const sessionToken = sessionStorage.getItem(ACCESS_KEY);
    if (sessionToken) {
      // 同步到内存缓存
      memoryTokens.access_token = sessionToken;
      return sessionToken;
    }
  } catch (error) {
    console.warn("SessionStorage access failed:", error);
  }

  // 3. 从 cookie 获取（兜底）
  try {
    const cookieToken = getCookie(ACCESS_KEY);
    if (cookieToken) {
      // 同步到内存和 sessionStorage
      memoryTokens.access_token = cookieToken;
      try {
        sessionStorage.setItem(ACCESS_KEY, cookieToken);
      } catch (error) {
        console.warn("SessionStorage write failed:", error);
      }
      return cookieToken;
    }
  } catch (error) {
    console.warn("Cookie access failed:", error);
  }

  return null;
}

/**
 * 获取 refresh token
 * 优先级：内存 > cookie
 */
export function getRefreshToken(): string | null {
  // 1. 优先从内存获取
  if (memoryTokens.refresh_token) {
    return memoryTokens.refresh_token;
  }

  // 2. 从 cookie 获取（兜底）
  try {
    const cookieToken = getCookie(REFRESH_KEY);
    if (cookieToken) {
      // 同步到内存缓存
      memoryTokens.refresh_token = cookieToken;
      return cookieToken;
    }
  } catch (error) {
    console.warn("Cookie access failed:", error);
  }

  return null;
}

/**
 * 设置 tokens
 * 同时存储到内存、sessionStorage 和 cookie
 */
export function setTokens(tokens: Tokens): void {
  // 1. 存储到内存
  memoryTokens.access_token = tokens.access_token;
  memoryTokens.refresh_token = tokens.refresh_token;

  // 2. 存储到 sessionStorage（仅 access_token）
  try {
    sessionStorage.setItem(ACCESS_KEY, tokens.access_token);
  } catch (error) {
    console.warn("SessionStorage write failed:", error);
  }

  // 3. 存储到 cookie（兜底，两个 token 都存储）
  try {
    // access_token 设置较短过期时间（1天）
    setCookie(ACCESS_KEY, tokens.access_token, {
      expires: 1,
      secure: true,
      sameSite: "Lax",
      httpOnly: false, // 允许 JavaScript 访问
    });

    // refresh_token 设置较长过期时间（7天）
    setCookie(REFRESH_KEY, tokens.refresh_token, {
      expires: 7,
      secure: true,
      sameSite: "Lax",
      httpOnly: false, // 允许 JavaScript 访问
    });
  } catch (error) {
    console.warn("Cookie write failed:", error);
  }
}

/**
 * 清除所有 tokens
 * 从内存、sessionStorage 和 cookie 中全部清除
 */
export function clearTokens(): void {
  // 1. 清除内存缓存
  memoryTokens = {};

  // 2. 清除 sessionStorage
  try {
    sessionStorage.removeItem(ACCESS_KEY);
  } catch (error) {
    console.warn("SessionStorage clear failed:", error);
  }

  // 3. 清除 cookie
  try {
    deleteCookie(ACCESS_KEY);
    deleteCookie(REFRESH_KEY);
  } catch (error) {
    console.warn("Cookie clear failed:", error);
  }
}

/**
 * 仅更新 access token（用于 token 刷新场景）
 */
export function updateAccessToken(accessToken: string): void {
  // 更新内存
  memoryTokens.access_token = accessToken;

  // 更新 sessionStorage
  try {
    sessionStorage.setItem(ACCESS_KEY, accessToken);
  } catch (error) {
    console.warn("SessionStorage write failed:", error);
  }

  // 更新 cookie
  try {
    setCookie(ACCESS_KEY, accessToken, {
      expires: 1,
      secure: true,
      sameSite: "Lax",
      httpOnly: false,
    });
  } catch (error) {
    console.warn("Cookie write failed:", error);
  }
}
