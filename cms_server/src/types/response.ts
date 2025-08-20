export interface Response<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp: string;
  path: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  data: null;
  timestamp: string;
  path: string;
}
