import type { TicketItemRaw, VerifyHistoryItem, VerifyTicketResponse } from '../types';
import { getJson, postJson } from '../utils/http';
import { toTicket } from './_transform.ts';

export async function verifyTicket(payload: { qrData: string; location: string }): Promise<VerifyTicketResponse> {
  const res = await postJson<{
    valid: boolean;
    ticket: TicketItemRaw;
    verificationRecord: {
      _id: string;
      ticketId: string;
      inspectorId: string;
      verifiedAt: string;
      result: 'valid' | 'invalid'
    };
  }, { qrData: string; location: string }>('/verify/ticket', payload);

  return {
    valid: res.valid,
    ticket: toTicket(res.ticket),
    verificationRecord: res.verificationRecord,
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
