// 统一服务端响应外壳
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

export type Role = 'GUEST' | 'USER' | 'ADMIN' | 'INSPECTOR';

// ---- User ----
export interface UserRaw {
  _id?: string;
  userId?: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  code: string;
}

export interface RefreshDto {
  refresh_token: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthPayload {
  access_token: string;
  refresh_token: string;
  user: UserRaw | User;
}

export interface SendCodeDto {
  email: string;
  type: 'register' | 'update';
}

export type UpdateUserDto = Partial<{
  username: string;
  email: string;
  password: string;
  newPassword: string;
  emailCode: string
}>

// ---- Concert ----
export type ConcertStatus = 'upcoming' | 'ongoing' | 'completed';

export interface ConcertRaw {
  _id: string;
  name: string;
  poster?: string;
  date: string;
  venue: string;
  adultPrice: number;
  childPrice: number;
  totalTickets: number;
  soldTickets?: number;
  status: ConcertStatus;
  maxAdultTicketsPerUser?: number;
  maxChildTicketsPerUser?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Concert {
  id: string;
  name: string;
  poster?: string;
  date: string;
  venue: string;
  adultPrice: number;
  childPrice: number;
  totalTickets: number;
  soldTickets?: number;
  status: ConcertStatus;
  maxAdultTicketsPerUser?: number;
  maxChildTicketsPerUser?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: ReadonlyArray<T>;
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface CreateConcertDto {
  name: string;
  date: string;
  venue: string;
  adultPrice: number;
  childPrice: number;
  totalTickets: number;
  maxAdultTicketsPerUser?: number;
  maxChildTicketsPerUser?: number;
  description?: string;
}

export type UpdateConcertDto = Partial<CreateConcertDto>;

// ---- Ticket ----
export type TicketStatus = 'valid' | 'used' | 'refunded';
export type TicketType = 'adult' | 'child';

export interface TicketConcertLite {
  id: string;
  name: string;
  date: string;
  venue: string;
}

export interface TicketItemRaw {
  _id: string;
  concertId?: string;
  concert?: { _id: string; name: string; date?: string; venue?: string };
  user?: string | { _id: string };
  userId?: string;
  type: TicketType;
  price: number;
  status: TicketStatus;
  signature?: string;
  qrCodeData?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketItem {
  id: string;
  concertId: string;
  concert?: TicketConcertLite;
  userId: string;
  type: TicketType;
  price: number;
  status: TicketStatus;
  signature?: string;
  qrCodeData?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketOrderDto {
  concertId: string;
  tickets: ReadonlyArray<{ type: TicketType; quantity: number }>;
}

export interface TicketQr {
  qrCode: string;
  ticketId?: string;
  signature?: string;
  data?: QrCodeData;
}

export interface QrCodeData {
  ticketId: string;
  signature: string;
  timestamp: number;
}


// ---- Refund (Admin) ----
export type RefundStatus = 'pending' | 'approved' | 'rejected';

export interface RefundRequest {
  ticketId: string;
  userId: string;
  concertId: string;
  reason: string;
  status: RefundStatus;
  requestTime: string;
  ticketInfo: { type: TicketType; price: number; concertName: string; venue: string };
  userInfo: { email: string; username: string };
}

// ---- Verify ----
export type VerifyResult = 'valid' | 'invalid';

export interface VerifyHistoryItem {
  _id: string;
  ticketId: string;
  inspectorId: string;
  verifiedAt: string;
  result: VerifyResult;
  notes?: string;
}

export interface VerifyTicketResponse {
  valid: boolean;
  ticket: {
    id: string;
    concertName: string;
    type: 'adult' | 'child';
    status: 'valid' | 'used' | 'refunded';
    userName: string;
  };
  verifiedAt: string;
}

// ---- BarcodeDetector API Types ----
export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: ReadonlyArray<{ x: number; y: number }>;
  format: string;
  rawValue: string;
}

export interface BarcodeDetectorOptions {
  formats?: ReadonlyArray<string>;
}

export interface BarcodeDetector {
  detect(image: ImageBitmapSource): Promise<ReadonlyArray<DetectedBarcode>>;
}

export interface BarcodeDetectorConstructor {
  new(options?: BarcodeDetectorOptions): BarcodeDetector;

  getSupportedFormats(): Promise<ReadonlyArray<string>>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}
