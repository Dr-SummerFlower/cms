import { TicketQRData } from './ecdsa';

export type TicketType = 'adult' | 'child';

export type TicketStatus = 'valid' | 'used' | 'refunded';

export interface TicketOrderItem {
  type: TicketType;
  quantity: number;
}

export interface TicketCreateData {
  concert: string;
  user: string;
  type: TicketType;
  price: number;
  signature: string;
  publicKey: string;
  qrCodeData: string;
}

export interface TicketQueryFilter {
  status?: TicketStatus;
  concert?: string;
  user?: string;
}

export interface VerificationRecordData {
  ticket: string;
  inspector: string;
  location: string;
  result: boolean;
  signature: string;
}

export interface TicketQRResponse {
  qrCode: string;
  data: TicketQRData;
}

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
