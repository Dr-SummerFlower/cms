import { TicketQRData } from './ecdsa';

/**
 * 票据类型。
 *
 * @category Model
 */
export type TicketType = 'adult' | 'child';

/**
 * 票据状态。
 *
 * @category Model
 */
export type TicketStatus = 'valid' | 'used' | 'refunded';

/**
 * 单种票型的下单信息。
 *
 * @category Model
 */
export interface TicketOrderItem {
  /** 票据类型。 */
  type: TicketType;
  /** 购买数量。 */
  quantity: number;
}

/**
 * 创建单张票据时写入数据库的数据结构。
 *
 * @category Model
 */
export interface TicketCreateData {
  /** 演唱会 ID。 */
  concert: string;
  /** 用户 ID。 */
  user: string;
  /** 票据类型。 */
  type: TicketType;
  /** 票价。 */
  price: number;
  /** 签名。 */
  signature: string;
  /** 公钥。 */
  publicKey: string;
  /** 二维码原始数据。 */
  qrCodeData: string;
  /** 实名。 */
  realName?: string;
  /** 身份证号。 */
  idCard?: string;
  /** 人脸图片地址。 */
  faceImage?: string;
}

/**
 * 票据查询时使用的筛选条件。
 *
 * @category Model
 */
export interface TicketQueryFilter {
  /** 票据状态。 */
  status?: TicketStatus;
  /** 演唱会 ID。 */
  concert?: string;
  /** 用户 ID。 */
  user?: string;
}

/**
 * 创建验票记录时使用的数据结构。
 *
 * @category Model
 */
export interface VerificationRecordData {
  /** 票据 ID。 */
  ticket: string;
  /** 检票员 ID。 */
  inspector: string;
  /** 验票地点。 */
  location: string;
  /** 验票结果。 */
  result: boolean;
  /** 使用的签名。 */
  signature: string;
}

/**
 * 动态二维码接口返回的数据结构。
 *
 * @category Model
 */
export interface TicketQRResponse {
  /** 二维码图片 Data URL。 */
  qrCode: string;
  /** 二维码承载的原始数据。 */
  data: TicketQRData;
  /** 刷新间隔（毫秒）。 */
  refreshInterval: number;
  /** 下一次刷新时间。 */
  nextRefreshTime: number;
}

/**
 * 验票接口返回的数据结构。
 *
 * @category Model
 */
export interface VerifyTicketResponse {
  /** 二维码是否验签通过。 */
  valid: boolean;
  /** 票据展示信息。 */
  ticket: {
    /** 票据 ID。 */
    id: string;
    /** 演唱会名称。 */
    concertName: string;
    /** 演唱会日期。 */
    concertDate: Date;
    /** 演唱会场馆。 */
    concertVenue: string;
    /** 票据类型。 */
    type: TicketType;
    /** 票价。 */
    price: number;
    /** 票据状态。 */
    status: TicketStatus;
    /** 用户名。 */
    userName: string;
    /** 用户邮箱。 */
    userEmail: string;
    /** 实名。 */
    realName?: string;
    /** 身份证号。 */
    idCard?: string;
    /** 人脸图片地址。 */
    faceImage?: string;
  };
  /** 验票时间。 */
  verifiedAt: Date;
  /** 是否需要人工确认。 */
  requiresManualVerification?: boolean;
}

/**
 * 退票申请数据结构。
 *
 * @category Model
 */
export interface RefundRequest {
  /** 票据 ID。 */
  ticketId: string;
  /** 用户 ID。 */
  userId: string;
  /** 演唱会 ID。 */
  concertId: string;
  /** 退票原因。 */
  reason: string;
  /** 申请状态。 */
  status: 'pending' | 'approved' | 'rejected';
  /** 申请时间。 */
  requestTime: string;
  /** 票据摘要信息。 */
  ticketInfo: TicketInfo;
  /** 用户摘要信息。 */
  userInfo: UserInfo;
  /** 审核时间。 */
  reviewTime?: string;
  /** 审核备注。 */
  reviewNote?: string;
  /** 审核管理员 ID。 */
  adminId?: string;
}

/**
 * 退票申请中附带的票据摘要信息。
 *
 * @category Model
 */
export interface TicketInfo {
  /** 票据类型。 */
  type: TicketType;
  /** 票价。 */
  price: number;
  /** 演唱会名称。 */
  concertName: string;
  /** 演唱会日期。 */
  concertDate: Date;
  /** 演唱会场馆。 */
  venue: string;
}

/**
 * 退票申请中附带的用户摘要信息。
 *
 * @category Model
 */
export interface UserInfo {
  /** 用户邮箱。 */
  email: string;
  /** 用户名。 */
  username: string;
}
