import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse, Tokens } from '../types';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth';

const API_BASE = '/api';

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

interface RetryConfig extends AxiosRequestConfig {
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
    const { response, config } = error as {
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
          '/auth/refresh',
          { refresh_token: refresh },
        );
        const tokens = resp.data.data;
        setTokens(tokens);
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
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// 统一 JSON/Form 方法
export async function getJson<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const resp = await http.get<ApiResponse<T>>(url, { params });
  return resp.data.data;
}

export async function postJson<T, B extends object>(
  url: string,
  body: B,
): Promise<T> {
  const resp = await http.post<ApiResponse<T>>(url, body);
  return resp.data.data;
}

export async function patchJson<T, B extends object>(
  url: string,
  body: B,
): Promise<T> {
  const resp = await http.patch<ApiResponse<T>>(url, body);
  return resp.data.data;
}

export async function putJson<T, B extends object>(
  url: string,
  body: B,
): Promise<T> {
  const resp = await http.put<ApiResponse<T>>(url, body);
  return resp.data.data;
}

export async function delJson<T>(url: string): Promise<T> {
  const resp = await http.delete<ApiResponse<T>>(url);
  return resp.data.data;
}

export async function postForm<T>(url: string, form: FormData): Promise<T> {
  const resp = await http.post<ApiResponse<T>>(url, form);
  return resp.data.data;
}

export async function patchForm<T>(url: string, form: FormData): Promise<T> {
  const resp = await http.patch<ApiResponse<T>>(url, form);
  return resp.data.data;
}

export default http;
