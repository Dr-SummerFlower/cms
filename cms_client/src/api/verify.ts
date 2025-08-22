import type { VerifyHistoryItem, VerifyTicketResponse } from '../types';
import { getJson, postJson } from '../utils/http';

export async function verifyTicket(payload: { qrData: string; location: string }): Promise<VerifyTicketResponse> {
  const res = await postJson<{
    valid: boolean;
    ticket: {
      id: string;
      concertName: string;
      type: 'adult' | 'child';
      status: 'valid' | 'used' | 'refunded';
      userName: string;
    };
    verifiedAt: string;
  }, { qrData: string; location: string }>('/verify/ticket', payload);

  return {
    valid: res.valid,
    ticket: res.ticket,
    verifiedAt: res.verifiedAt,
  };
}

export async function verifyHistory(q?: {
  concertId?: string;
  startDate?: string;
  endDate?: string;
  inspectorId?: string
}): Promise<ReadonlyArray<VerifyHistoryItem>> {
  return getJson<ReadonlyArray<VerifyHistoryItem>>('/verify/history', q);
}
