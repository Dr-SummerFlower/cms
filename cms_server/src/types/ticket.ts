import { TicketQRData } from './ecdsa';

export type TicketType = 'adult' | 'child';

export type TicketStatus = 'valid' | 'used' | 'refunded';

/**
 * @interface
 * @property {TicketType} type - 门票类型
 * @property {number} quantity - 门票数量
 */
export interface TicketOrderItem {
  type: TicketType;
  quantity: number;
}

/**
 * @interface
 * @property {string} concert - 演唱会ID
 * @property {string} user - 用户ID
 * @property {TicketType} type - 门票类型
 * @property {number} price - 门票价格
 * @property {string} signature - 签名
 * @property {string} publicKey - 公钥
 * @property {string} qrCodeData - 二维码数据
 */
export interface TicketCreateData {
  concert: string;
  user: string;
  type: TicketType;
  price: number;
  signature: string;
  publicKey: string;
  qrCodeData: string;
}

/**
 * @interface
 * @property {TicketStatus} [status] - 门票状态
 * @property {string} [concert] - 演唱会ID
 * @property {string} [user] - 用户ID
 */
export interface TicketQueryFilter {
  status?: TicketStatus;
  concert?: string;
  user?: string;
}

/**
 * @interface
 * @property {string} ticket - 门票ID
 * @property {string} inspector - 检票员ID
 * @property {string} location - 检票位置
 * @property {boolean} result - 验证结果
 * @property {string} signature - 签名
 */
export interface VerificationRecordData {
  ticket: string;
  inspector: string;
  location: string;
  result: boolean;
  signature: string;
}

/**
 * @interface
 * @property {string} qrCode - 二维码图片数据
 * @property {TicketQRData} data - 二维码数据内容
 */
export interface TicketQRResponse {
  qrCode: string;
  data: TicketQRData;
}

/**
 * @interface
 * @property {boolean} valid - 验证是否有效
 * @property {Object} ticket - 门票信息
 * @property {string} ticket.id - 门票ID
 * @property {string} ticket.concertName - 演唱会名称
 * @property {TicketType} ticket.type - 门票类型
 * @property {TicketStatus} ticket.status - 门票状态
 * @property {string} ticket.userName - 用户名
 * @property {Date} verifiedAt - 验证时间
 */
export interface VerifyTicketResponse {
  valid: boolean;
  ticket: {
    id: string;
    concertName: string;
    type: TicketType;
    status: TicketStatus;
    userName: string;
  };
  verifiedAt: Date;
}

export interface RefundRequest {
  ticketId: string;
  userId: string;
  concertId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestTime: string;
  ticketInfo: TicketInfo;
  userInfo: UserInfo;
  reviewTime?: string;
  reviewNote?: string;
  adminId?: string;
}

export interface TicketInfo {
  type: TicketType;
  price: number;
  concertName: string;
  concertDate: Date;
  venue: string;
}

export interface UserInfo {
  email: string;
  username: string;
}
