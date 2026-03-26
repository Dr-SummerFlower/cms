/**
 * 通用成功响应结构。
 *
 * @typeParam T - 实际业务数据类型
 * @category Model
 */
export interface Response<T> {
  /** 业务状态码。 */
  code: number;
  /** 响应消息。 */
  message: string;
  /** 业务数据。 */
  data: T | null;
  /** 响应时间。 */
  timestamp: string;
  /** 请求路径。 */
  path: string;
}

/**
 * 通用错误响应结构。
 *
 * @category Model
 */
export interface ErrorResponse {
  /** 业务状态码。 */
  code: number;
  /** 错误消息。 */
  message: string;
  /** 错误响应不返回业务数据。 */
  data: null;
  /** 响应时间。 */
  timestamp: string;
  /** 请求路径。 */
  path: string;
}
