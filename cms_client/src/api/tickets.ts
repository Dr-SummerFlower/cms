import type {
  CreateTicketOrderDto,
  RefundRequest,
  RefundStatus,
  TicketItem,
  TicketItemRaw,
  TicketQr,
} from "../types";
import { getJson, postForm, postJson, putJson } from "../utils/http";
import { toTicket } from "./_transform.ts";

// 创建订单：返回每张票据
export async function createOrder(
  dto: CreateTicketOrderDto,
  faceImages: ReadonlyArray<File>,
): Promise<ReadonlyArray<TicketItem>> {
  const formData = new FormData();

  // 添加 JSON 数据
  formData.append("data", JSON.stringify(dto));

  // 添加所有人脸图像
  faceImages.forEach((file) => {
    formData.append("faceImages", file);
  });

  const raws = await postForm<ReadonlyArray<TicketItemRaw>>(
    "/tickets/orders",
    formData,
  );
  return raws.map(toTicket);
}

export async function myTickets(params?: {
  status?: "valid" | "used" | "refunded";
  concertId?: string;
}): Promise<ReadonlyArray<TicketItem>> {
  const raws = await getJson<ReadonlyArray<TicketItemRaw>>(
    "/tickets/my",
    params,
  );
  return raws.map(toTicket);
}

export async function ticketDetail(id: string): Promise<TicketItem> {
  const raw = await getJson<TicketItemRaw>(`/tickets/${id}`);
  return toTicket(raw);
}

export async function refundTicket(
  id: string,
  reason: string,
): Promise<{ success: boolean; message: string }> {
  return postJson<{ success: boolean; message: string }, { reason: string }>(
    `/tickets/${id}/refund`,
    { reason },
  );
}

export async function ticketQr(id: string): Promise<TicketQr> {
  return getJson<TicketQr>(`/tickets/${id}/qr`);
}

// ---------- 管理员：退票审核 ----------
export interface RefundRequestQuery {
  status?: RefundStatus;
  concertId?: string;
  userId?: string;

  [key: string]: unknown;
}

export async function listRefundRequests(
  q?: RefundRequestQuery,
): Promise<ReadonlyArray<RefundRequest>> {
  return getJson<ReadonlyArray<RefundRequest>>("/tickets/refund-requests", q);
}

export async function reviewRefund(
  ticketId: string,
  approved: boolean,
  reviewNote?: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  return putJson<
    { success: boolean; message: string },
    { approved: boolean; reviewNote?: string }
  >(`/tickets/refund-requests/${ticketId}/review`, { approved, reviewNote });
}
