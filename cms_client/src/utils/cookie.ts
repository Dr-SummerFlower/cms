/**
 * Cookie 操作工具函数
 * 提供安全的 cookie 设置、获取和删除功能
 */

export interface CookieOptions {
  /** 过期时间（天数） */
  expires?: number;
  /** 路径 */
  path?: string;
  /** 域名 */
  domain?: string;
  /** 是否仅在 HTTPS 下传输 */
  secure?: boolean;
  /** SameSite 属性 */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** 是否仅服务器可访问（设为 false 以便 JS 访问） */
  httpOnly?: boolean;
}

/**
 * 设置 cookie
 * @param name cookie 名称
 * @param value cookie 值
 * @param options cookie 选项
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  const {
    expires = 7, // 默认7天过期
    path = '/',
    domain,
    secure = location.protocol === 'https:', // 在 HTTPS 下自动启用 secure
    sameSite = 'Lax',
    httpOnly = false, // 设为 false 以便 JavaScript 访问
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // 设置过期时间
  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // 设置路径
  cookieString += `; path=${path}`;

  // 设置域名
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  // 设置安全属性
  if (secure) {
    cookieString += '; secure';
  }

  // 设置 SameSite
  cookieString += `; samesite=${sameSite}`;

  // 设置 HttpOnly（注意：如果设为 true，JavaScript 将无法访问）
  if (httpOnly) {
    cookieString += '; httponly';
  }

  document.cookie = cookieString;
}

/**
 * 获取 cookie 值
 * @param name cookie 名称
 * @returns cookie 值，如果不存在则返回 null
 */
export function getCookie(name: string): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * 删除 cookie
 * @param name cookie 名称
 * @param options cookie 选项（主要是 path 和 domain）
 */
export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
  const { path = '/', domain } = options;

  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  document.cookie = cookieString;
}
