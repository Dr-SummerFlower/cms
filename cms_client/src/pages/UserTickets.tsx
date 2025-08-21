import { App as AntdApp, Button, Segmented, Space, Table, Tag, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { refundTicket, ticketQr } from '../api/tickets';
import TicketQrModal from '../components/ticket/TicketQrModal';
import { useTicketStore } from '../stores/ticketStore';
import type { TicketItem } from '../types';

type StatusFilter = 'all' | 'valid' | 'used' | 'refunded';

export default function UserTickets(): JSX.Element {
  const { items, loading, fetch } = useTicketStore();
  const { message, modal } = AntdApp.useApp();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<string>('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const navigate = useNavigate();

  const queryParam = useMemo(() => (status === 'all' ? undefined : { status }), [status]);

  useEffect(() => { void fetch(queryParam); }, [fetch, queryParam]);

  const openQr = async (row: TicketItem): Promise<void> => {
    if (row.qrCodeData) {
      setQrData(row.qrCodeData);
      setQrOpen(true);
      return;
    }
    try {
      const qr = await ticketQr(row.id);
      const dataStr = JSON.stringify(qr.data ?? {});
      setQrData(dataStr);
      setQrOpen(true);
    } catch {
      message.error('获取二维码失败');
    }
  };

  const onRefund = (row: TicketItem): void => {
    modal.confirm({
      title: '申请退票',
      content: '确认对该票据发起退票申请吗？',
      onOk: async () => {
        try { await refundTicket(row.id, '用户申请退票'); message.success('退票申请已提交'); void fetch(queryParam); }
        catch { message.error('退票申请失败'); }
      }
    });
  };

  const columns = [
    { title: '票据ID', dataIndex: 'id', key: 'id', width: 220 },
    { title: '演唱会', key: 'concert', render: (_: unknown, r: TicketItem) => r.concert?.name ?? '-' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: TicketItem['type']) => (t === 'adult' ? '成人' : '儿童') },
    { title: '价格', dataIndex: 'price', key: 'price', width: 100, render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: (s: TicketItem['status']) => {
        const color = s === 'valid' ? 'green' : s === 'used' ? 'blue' : 'red';
        const text = s === 'valid' ? '未使用' : s === 'used' ? '已使用' : '已退款';
        return <Tag color={color}>{text}</Tag>;
      }},
    { title: '购买时间', dataIndex: 'createdAt', key: 'createdAt', width: 200 },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_: unknown, r: TicketItem) => (
        <Space>
          <Button onClick={() => void openQr(r)}>二维码</Button>
          <Button onClick={() => navigate(`/me/tickets/${r.id}`)}>查看详情</Button>
          <Tooltip title="仅未使用可申请退票">
            <Button danger disabled={r.status !== 'valid'} onClick={() => onRefund(r)}>申请退票</Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filterOptions = [
    { label: '全部', value: 'all' },
    { label: '未使用', value: 'valid' },
    { label: '已使用', value: 'used' },
    { label: '已退款', value: 'refunded' },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Segmented options={filterOptions} value={status} onChange={(v) => setStatus(v as StatusFilter)} />
      </Space>
      <Table<TicketItem> rowKey="id" loading={loading} dataSource={items} columns={columns} pagination={false} />
      <TicketQrModal open={qrOpen} onClose={() => setQrOpen(false)} qrData={qrData} />
    </>
  );
}
