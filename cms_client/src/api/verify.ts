import type { VerifyHistoryItem, VerifyQrCodeDto, VerifyTicketResponse } from '../types';
import { getJson, postJson } from '../utils/http';

export async function verifyTicket(payload: VerifyQrCodeDto): Promise<VerifyTicketResponse> {
  const res = await postJson<VerifyTicketResponse, VerifyQrCodeDto>('/verify/ticket', payload);

  return {
    valid: res.valid,
    ticket: res.ticket,
    verifiedAt: res.verifiedAt,
  };
}

export async function confirmVerification(ticketId: string): Promise<{ success: boolean; message: string }> {
  return postJson<{ success: boolean; message: string }, { ticketId: string }>('/verify/confirm', { ticketId });
}

export async function verifyHistory(q?: {
  concertId?: string;
  startDate?: string;
  endDate?: string;
  inspectorId?: string
}): Promise<ReadonlyArray<VerifyHistoryItem>> {
  return getJson<ReadonlyArray<VerifyHistoryItem>>('/verify/history', q);
}
