import { App as AntdApp, Button, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { listRefundRequests, reviewRefund } from '../../api/tickets';
import type { RefundRequest } from '../../types';

export default function AdminRefunds(): JSX.Element {
  const [rows, setRows] = useState<ReadonlyArray<RefundRequest>>([]);
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();

  const fetch = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await listRefundRequests();
      setRows(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetch();
  }, []);

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => void fetch()}>刷新</Button>
      </Space>
      <Table<RefundRequest>
        rowKey={(r) => `${r.ticketId}-${r.userId}`}
        loading={loading}
        dataSource={rows}
        columns={[
          { title: '票据ID', dataIndex: 'ticketId' },
          { title: '用户', dataIndex: ['userInfo', 'username'] },
          { title: '邮箱', dataIndex: ['userInfo', 'email'] },
          { title: '演唱会', dataIndex: ['ticketInfo', 'concertName'] },
          { title: '价格', dataIndex: ['ticketInfo', 'price'], render: (v: number) => `¥${v}` },
          {
            title: '状态',
            dataIndex: 'status',
            render: (s) => <Tag color={s === 'pending' ? 'gold' : s === 'approved' ? 'green' : 'red'}>{s}</Tag>,
          },
          {
            title: '操作',
            render: (_, r) => (
              <Space>
                <Button size="small" type="primary" disabled={r.status !== 'pending'} onClick={async () => {
                  try {
                    await reviewRefund(r.ticketId, true, '同意');
                    message.success('已通过');
                    void fetch();
                  } catch {
                    message.error('操作失败');
                  }
                }}>通过</Button>
                <Button size="small" danger disabled={r.status !== 'pending'} onClick={async () => {
                  try {
                    await reviewRefund(r.ticketId, false, '拒绝');
                    message.success('已拒绝');
                    void fetch();
                  } catch {
                    message.error('操作失败');
                  }
                }}>拒绝</Button>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
