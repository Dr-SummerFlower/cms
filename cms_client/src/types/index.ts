/**
 * 基础API响应结构
 * @interface BaseResponse
 */
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

/**
 * 用户信息
 * @interface User
 */
export interface User {
  /**
   * 用户ID
   * @property _id
   */
  _id: string;
  /**
   * 用户名
   * @property username
   */
  username: string;
  /**
   * 用户邮箱
   * @property email
   */
  email: string;
  /**
   * 用户角色
   * @property role
   */
  role: string;
  /**
   * 创建时间
   * @property createdAt
   */
  createdAt: string;
  /**
   * 更新时间
   * @property updatedAt
   */
  updatedAt: string;
}

/**
 * 分页用户列表
 * @interface PaginatedUsers
 */
export interface PaginatedUsers {
  /**
   * 用户列表
   * @property users
   */
  users: User[];
  /**
   * 总数
   * @property total
   */
  total: number;
  /**
   * 当前页码
   * @property page
   */
  page: number;
  /**
   * 每页数量
   * @property limit
   */
  limit: number;
  /**
   * 总页数
   * @property totalPages
   */
  totalPages: number;
}

/**
 * 认证令牌
 * @interface Tokens
 */
export interface Tokens {
  /**
   * JWT访问令牌
   * @property access_token
   */
  access_token: string;
  /**
   * JWT刷新令牌
   * @property refresh_token
   */
  refresh_token: string;
}

/**
 * 演唱会信息
 * @interface Concert
 */
export interface Concert {
  /**
   * 演唱会ID
   * @property _id
   */
  _id: string;
  /**
   * 演唱会名称
   * @property name
   */
  name: string;
  /**
   * 演出日期
   * @property date
   */
  date: string;
  /**
   * 演出场馆
   * @property venue
   */
  venue: string;
  /**
   * 成人票价
   * @property adultPrice
   */
  adultPrice: number;
  /**
   * 儿童票价
   * @property childPrice
   */
  childPrice: number;
  /**
   * 总票数
   * @property totalTickets
   */
  totalTickets: number;
  /**
   * 已售票数
   * @property soldTickets
   */
  soldTickets: number;
  /**
   * 状态
   * @property status
   */
  status: string;
  /**
   * 描述
   * @property description
   */
  description: string;
  /**
   * 公钥
   * @property publicKey
   */
  publicKey?: string;
  /**
   * 创建时间
   * @property createdAt
   */
  createdAt: string;
  /**
   * 更新时间
   * @property updatedAt
   */
  updatedAt: string;
}

/**
 * 分页演唱会列表
 * @interface PaginatedConcerts
 */
export interface PaginatedConcerts {
  /**
   * 演唱会列表
   * @property concerts
   */
  concerts: Concert[];
  /**
   * 总数
   * @property total
   */
  total: number;
  /**
   * 当前页码
   * @property page
   */
  page: number;
  /**
   * 每页数量
   * @property limit
   */
  limit: number;
  /**
   * 总页数
   * @property totalPages
   */
  totalPages: number;
}

/**
 * 票务信息
 * @interface Ticket
 */
export interface Ticket {
  /**
   * 票务ID
   * @property _id
   */
  _id: string;
  /**
   * 演唱会ID
   * @property concertId
   */
  concertId: string;
  /**
   * 用户ID
   * @property userId
   */
  userId: string;
  /**
   * 票类型
   * @property type
   */
  type: string;
  /**
   * 价格
   * @property price
   */
  price: number;
  /**
   * 状态
   * @property status
   */
  status: string;
  /**
   * 签名
   * @property signature
   */
  signature: string;
  /**
   * 创建时间
   * @property createdAt
   */
  createdAt: string;
  /**
   * 更新时间
   * @property updatedAt
   */
  updatedAt: string;
  /**
   * 退票原因
   * @property refundReason
   */
  refundReason?: string;
  /**
   * 退票时间
   * @property refundedAt
   */
  refundedAt?: string;
}

/**
 * 二维码数据
 * @interface QRCodeData
 */
export interface QRCodeData {
  /**
   * 二维码图片数据
   * @property qrCode
   */
  qrCode: string;
  /**
   * 票务ID
   * @property ticketId
   */
  ticketId: string;
  /**
   * 签名
   * @property signature
   */
  signature: string;
}

/**
 * 验证记录
 * @interface VerificationRecord
 */
export interface VerificationRecord {
  /**
   * 记录ID
   * @property _id
   */
  _id: string;
  /**
   * 票务ID
   * @property ticketId
   */
  ticketId: string;
  /**
   * 检票员ID
   * @property inspectorId
   */
  inspectorId: string;
  /**
   * 验证时间
   * @property verifiedAt
   */
  verifiedAt: string;
  /**
   * 验证结果
   * @property result
   */
  result: string;
  /**
   * 备注
   * @property notes
   */
  notes?: string;
}

/**
 * 票务验证结果
 * @interface VerifyTicketResult
 */
export interface VerifyTicketResult {
  /**
   * 是否有效
   * @property valid
   */
  valid: boolean;
  /**
   * 票务信息
   * @property ticket
   */
  ticket: Ticket;
  /**
   * 验证记录
   * @property verificationRecord
   */
  verificationRecord: VerificationRecord;
}

/**
 * 验证码发送成功响应
 * @interface SendCodeSuccess
 */
export interface SendCodeSuccess {
  /**
   * 成功消息
   * @property message
   */
  message: string;
}

// ========================
// API 响应类型定义
// ========================

/**
 * App API响应
 * @type GetHelloResponse
 */
export type GetHelloResponse = BaseResponse<string>;

/**
 * 用户列表响应
 * 分页获取用户列表的响应类型
 * @type FindAllUsersResponse
 */
export type FindAllUsersResponse = BaseResponse<PaginatedUsers>;

/**
 * 用户详情响应
 * @type GetUserByIdResponse
 */
export type GetUserByIdResponse = BaseResponse<User>;

/**
 * 更新用户响应
 * @type UpdateUserResponse
 */
export type UpdateUserResponse = BaseResponse<User>;

/**
 * 删除用户响应
 * @type DeleteUserResponse
 */
export type DeleteUserResponse = BaseResponse<User>;

/**
 * 更新用户角色响应
 * @type UpdateUserRoleResponse
 */
export type UpdateUserRoleResponse = BaseResponse<User>;

/**
 * 登录响应
 * @type LoginResponse
 */
export type LoginResponse = BaseResponse<Tokens>;

/**
 * 注册响应
 * @type RegisterResponse
 */
export type RegisterResponse = BaseResponse<Tokens>;

/**
 * 刷新令牌响应
 * @type RefreshTokenResponse
 */
export type RefreshTokenResponse = BaseResponse<Tokens>;

/**
 * 发送验证码响应
 * @type SendCodeResponse
 */
export type SendCodeResponse = BaseResponse<SendCodeSuccess>;

/**
 * 创建演唱会响应
 * @type CreateConcertResponse
 */
export type CreateConcertResponse = BaseResponse<Concert>;

/**
 * 演唱会列表响应
 * @type FindAllConcertsResponse
 */
export type FindAllConcertsResponse = BaseResponse<PaginatedConcerts>;

/**
 * 演唱会详情响应
 * @type GetConcertByIdResponse
 */
export type GetConcertByIdResponse = BaseResponse<Concert>;

/**
 * 更新演唱会响应
 * @type UpdateConcertResponse
 */
export type UpdateConcertResponse = BaseResponse<Concert>;

/**
 * 删除演唱会响应
 * @type DeleteConcertResponse
 */
export type DeleteConcertResponse = BaseResponse<null>;

/**
 * 创建票务订单响应
 * @type CreateTicketOrderResponse
 */
export type CreateTicketOrderResponse = BaseResponse<Ticket[]>;

/**
 * 我的票务列表响应
 * @type GetMyTicketsResponse
 */
export type GetMyTicketsResponse = BaseResponse<Ticket[]>;

/**
 * 票务详情响应
 * @type GetTicketDetailResponse
 */
export type GetTicketDetailResponse = BaseResponse<Ticket>;

/**
 * 退票响应
 * @type RefundTicketResponse
 */
export type RefundTicketResponse = BaseResponse<Ticket>;

/**
 * 生成二维码响应
 * @type GenerateQRCodeResponse
 */
export type GenerateQRCodeResponse = BaseResponse<QRCodeData>;

/**
 * 验证票务响应
 * @type VerifyTicketResponse
 */
export type VerifyTicketResponse = BaseResponse<VerifyTicketResult>;

/**
 * 验证历史记录响应
 * @type GetVerificationHistoryResponse
 */
export type GetVerificationHistoryResponse = BaseResponse<VerificationRecord[]>;
