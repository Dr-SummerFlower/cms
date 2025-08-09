/**
 * @interface
 * @property {number} code - 状态码
 * @property {string} message - 状态信息
 * @property {T | null} data - 数据
 */
export interface Response<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp: string;
  path: string;
}

/**
 * @interface
 * @property {number} code - 错误状态码
 * @property {string} message - 错误信息
 * @property {unknown} data - 错误数据
 * @property {string} timestamp - 时间戳
 * @property {string} path - 请求路径
 */
export interface ErrorResponse {
  code: number;
  message: string;
  data: unknown;
  timestamp: string;
  path: string;
}