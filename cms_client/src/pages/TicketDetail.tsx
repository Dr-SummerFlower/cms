import { App as AntdApp, Button, Card, Descriptions, Divider, QRCode, Space } from 'antd';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ticketDetail, ticketQr } from '../api/tickets';
import StatusTag from '../components/common/StatusTag.tsx';
import type { TicketItem, TicketQr as TicketQrType } from '../types';

export default function TicketDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { message } = AntdApp.useApp();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [qr, setQr] = useState<{ png?: string; data?: string }>({});

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const t = await ticketDetail(id);
        setTicket(t);
        if (t.qrCodeData) {
          setQr({ data: t.qrCodeData });
        } else {
          const res: TicketQrType = await ticketQr(id);
          const dataStr = JSON.stringify(res.data ?? {});
          setQr({ png: res.qrCode, data: dataStr });
        }
      } catch {
        message.error('加载票据详情失败');
      }
    })();
  }, [id, message]);

  if (!ticket) return <Card loading />;

  return (
    <Card
      title="票据详情"
      style={{ maxWidth: 960, margin: '0 auto' }}
      extra={
        <Link to="/me/tickets">
          <Button>返回</Button>
        </Link>
      }
    >
      <Descriptions
        bordered
        column={2}
        items={[
          { key: 'id', label: '票据ID', children: ticket.id },
          {
            key: 'concert',
            label: '演唱会',
            children: ticket.concert?.name ?? '-',
          },
          {
            key: 'type',
            label: '类型',
            children: ticket.type === 'adult' ? '成人' : '儿童',
          },
          { key: 'price', label: '价格', children: `¥${ticket.price}` },
          {
            key: 'status',
            label: '状态',
            children: <StatusTag kind="ticket" value={ticket.status} />,
          },
          {
            key: 'createdAt',
            label: '购买时间',
            children: ticket.createdAt ?? '-',
          },
        ]}
      />
      <Divider />
      <Space
        direction="vertical"
        size="middle"
        style={{ width: '100%', alignItems: 'center' }}
      >
        {!!qr.data && <QRCode value={qr.data} size={240} />}
        {!!qr.png && (
          <img
            src={qr.png}
            alt="ticket-qr"
            style={{ width: 240, height: 240 }}
          />
        )}
      </Space>
    </Card>
  );
}
