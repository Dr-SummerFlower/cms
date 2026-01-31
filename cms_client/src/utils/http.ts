import {message} from 'antd';
import axios, {type AxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse} from 'axios';
import {useAuthStore} from '../stores/authStore';
import type {ApiResponse, Tokens} from '../types';
import {clearTokens, getAccessToken, getRefreshToken, setTokens, updateAccessToken} from './auth';

// 扩展 AxiosRequestConfig 以支持跳过全局错误处理
export interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  skipGlobalErrorHandler?: boolean;
}

// 全局错误处理函数
function handleGlobalError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ApiResponse<unknown>>;

    // 详细错误信息打印到控制台
    console.error("HTTP请求错误详情:", {
      error: ax,
      response: ax.response,
      status: ax.response?.status,
      data: ax.response?.data,
      message: ax.message,
      code: ax.code,
      config: ax.config,
    });

    const status = ax.response?.status;

    // 根据错误类型显示用户友好的通知
    if (status === 401) {
      // 401错误通常由拦截器处理，这里不显示通知
      return;
    } else if (status === 403) {
      message.error("权限不足：您没有权限执行此操作");
    } else if (status === 404) {
      message.error("资源不存在：请求的资源未找到");
    } else if (status === 500) {
      message.error("服务器错误：服务器内部错误，请稍后重试");
    } else if (typeof status === "number" && status >= 400 && status < 500) {
      let errorMessage: string | undefined;
      const data = ax.response?.data;
      if (data && typeof data === "object" && "message" in data) {
        const msgVal = (data as { message?: unknown }).message;
        if (typeof msgVal === "string") errorMessage = msgVal;
      }
      message.warning(`请求失败：${errorMessage ?? "请求参数错误"}`);
    } else if (ax.code === "NETWORK_ERROR" || ax.code === "ECONNABORTED") {
      message.error("网络错误：网络连接失败，请检查网络设置");
    } else if (ax.code === "TIMEOUT") {
      message.warning("请求超时：请求超时，请稍后重试");
    } else {
      message.error("未知错误：发生了未知错误，请稍后重试");
    }
  } else {
    // 非 AxiosError 的兜底处理
    console.error("HTTP请求未知错误详情:", error);
    message.error("未知错误：发生了未知错误，请稍后重试");
  }
}

// API基础路径 - 开发环境通过Vite代理，生产环境需要配置nginx等反向代理
const API_BASE = "/api";

const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

let isRefreshing = false;
type Subscriber = (token: string) => void;
let subscribers: Subscriber[] = [];

function subscribe(cb: Subscriber): void {
  subscribers.push(cb);
}

function notifyAll(token: string): void {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

interface RetryConfig extends ExtendedAxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const {response, config} = error as {
      response?: AxiosResponse<ApiResponse<unknown>>;
      config: RetryConfig;
    };

    if (response?.status === 401 && !config._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribe((newToken: string) => {
            const newConfig: RetryConfig = {
              ...config,
              _retry: true,
              headers: {
                ...(config.headers || {}),
                Authorization: `Bearer ${newToken}`,
              },
            };
            resolve(http(newConfig));
          });
        });
      }

      isRefreshing = true;
      config._retry = true;
      try {
        const resp = await refreshClient.post<ApiResponse<Tokens>>(
          "/auth/refresh",
          {refresh_token: refresh},
        );

        // 校验响应数据
        if (!resp.data || !resp.data.data) {
          throw new Error("Token 刷新失败：响应数据为空");
        }

        const tokens = resp.data.data;

        // 校验 tokens 对象的必要字段
        if (!tokens.access_token) {
          throw new Error("Token 刷新失败：缺少 access_token");
        }

        // 如果服务器返回了新的refresh_token，使用setTokens；否则只更新access_token
        if (tokens.refresh_token && tokens.refresh_token !== refresh) {
          setTokens(tokens);
        } else {
          updateAccessToken(tokens.access_token);
        }
        notifyAll(tokens.access_token);
        const newConfig: RetryConfig = {
          ...config,
          headers: {
            ...(config.headers || {}),
            Authorization: `Bearer ${tokens.access_token}`,
          },
        };
        return http(newConfig);
      } catch (e) {
        clearTokens();
        useAuthStore.getState().logout();
        handleGlobalError(e);
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    // 对于非401错误，使用全局错误处理（除非请求配置了 skipGlobalErrorHandler）
    if (!config.skipGlobalErrorHandler) {
      handleGlobalError(error);
    }
    return Promise.reject(error);
  },
);

// 数据校验辅助函数
function validateResponseData<T>(resp: AxiosResponse<ApiResponse<T>>, method: string): T {
  if (!resp.data) {
    throw new Error(`${method}: 响应数据为空`);
  }

  // 检查 data 字段是否存在
  if (!('data' in resp.data)) {
    throw new Error(`${method}: 响应缺少 data 字段`);
  }

  // 允许 null/undefined 作为有效响应,但需要类型上明确处理
  const data = resp.data.data;
  if (data === null || data === undefined) {
    console.warn(`${method}: 响应 data 为 null 或 undefined`);
  }

  return data;
}

// 统一 JSON/Form 方法
export async function getJson<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.get<ApiResponse<T>>(url, {...config, params});
  return validateResponseData(resp, 'GET');
}

export async function postJson<T, B extends object>(
  url: string,
  body: B,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.post<ApiResponse<T>>(url, body, config);
  return validateResponseData(resp, 'POST');
}

export async function patchJson<T, B extends object>(
  url: string,
  body: B,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.patch<ApiResponse<T>>(url, body, config);
  return validateResponseData(resp, 'PATCH');
}

export async function putJson<T, B extends object>(
  url: string,
  body: B,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.put<ApiResponse<T>>(url, body, config);
  return validateResponseData(resp, 'PUT');
}

export async function delJson<T>(
  url: string,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.delete<ApiResponse<T>>(url, config);
  return validateResponseData(resp, 'DELETE');
}

export async function postForm<T>(
  url: string,
  form: FormData,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.post<ApiResponse<T>>(url, form, config);
  return validateResponseData(resp, 'POST_FORM');
}

export async function patchForm<T>(
  url: string,
  form: FormData,
  config?: ExtendedAxiosRequestConfig,
): Promise<T> {
  const resp = await http.patch<ApiResponse<T>>(url, form, config);
  return validateResponseData(resp, 'PATCH_FORM');
}

export default http;
