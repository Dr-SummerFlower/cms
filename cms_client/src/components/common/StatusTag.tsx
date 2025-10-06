import { Tag } from 'antd';
import type { ConcertStatus, RefundStatus, TicketStatus, VerifyResult } from '../../types';

type StatusKind = 'ticket' | 'concert' | 'refund' | 'verify';

type KindValueMap = {
  ticket: TicketStatus;
  concert: ConcertStatus;
  refund: RefundStatus;
  verify: VerifyResult;
};

type StatusTagProps<K extends StatusKind> = {
  kind: K;
  value: KindValueMap[K];
};

const ticketMap: Record<TicketStatus, { color: string; text: string }> = {
  valid: { color: 'green', text: '未使用' },
  used: { color: 'blue', text: '已使用' },
  refunded: { color: 'red', text: '已退款' },
};

const concertMap: Record<
  ConcertStatus,
  { color: 'warning' | 'processing' | 'default'; text: string }
> = {
  upcoming: { color: 'warning', text: '即将开始' },
  ongoing: { color: 'processing', text: '进行中' },
  completed: { color: 'default', text: '已结束' },
};

const refundMap: Record<RefundStatus, { color: string; text: string }> = {
  pending: { color: 'gold', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已拒绝' },
};

const verifyMap: Record<VerifyResult, { color: string; text: string }> = {
  valid: { color: 'green', text: '有效' },
  invalid: { color: 'red', text: '无效' },
};

export default function StatusTag<K extends StatusKind>({
                                                          kind,
                                                          value,
                                                        }: StatusTagProps<K>): JSX.Element {
  if (kind === 'ticket') {
    const { color, text } = ticketMap[value as TicketStatus];
    return <Tag color={color}>{text}</Tag>;
  }
  if (kind === 'concert') {
    const { color, text } = concertMap[value as ConcertStatus];
    return <Tag color={color}>{text}</Tag>;
  }
  if (kind === 'refund') {
    const { color, text } = refundMap[value as RefundStatus];
    return <Tag color={color}>{text}</Tag>;
  }
  const { color, text } = verifyMap[value as VerifyResult];
  return <Tag color={color}>{text}</Tag>;
}


export function ConcertStatusTag({
                                   status,
                                 }: {
  status: ConcertStatus;
}): JSX.Element {
  return <StatusTag kind="concert" value={status} />;
}


export function VerifyResultTag({
                                  result,
                                }: {
  result: VerifyResult;
}): JSX.Element {
  return <StatusTag kind="verify" value={result} />;
}
