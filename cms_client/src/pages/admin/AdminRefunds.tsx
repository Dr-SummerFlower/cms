import { Button, Input, message, Modal, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listRefundRequests, reviewRefund } from '../../api/tickets';
import StatusTag from '../../components/common/StatusTag.tsx';
import type { RefundRequest, RefundStatus } from '../../types';

type ReviewAction = { ticketId: string; approved: boolean };

export default function AdminRefunds(): JSX.Element {
  const [rows, setRows] = useState<ReadonlyArray<RefundRequest>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [noteOpen, setNoteOpen] = useState<boolean>(false);
  const [noteText, setNoteText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);

  const [reasonOpen, setReasonOpen] = useState<boolean>(false);
  const [reasonText, setReasonText] = useState<string>('');

  const fetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await listRefundRequests();
      setRows(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const askNoteAndReview = (ticketId: string, approved: boolean): void => {
    setPendingAction({ ticketId, approved });
    setNoteText('');
    setNoteOpen(true);
  };

  const submitReview = async (): Promise<void> => {
    const note = noteText.trim();
    if (!note) {
      message.error('请填写审核意见');
      return;
    }
    if (!pendingAction) return;
    try {
      await reviewRefund(pendingAction.ticketId, pendingAction.approved, note);
      message.success(pendingAction.approved ? '已通过' : '已拒绝');
      setNoteOpen(false);
      setPendingAction(null);
      setNoteText('');
      await fetch();
    } catch {
      message.error('操作失败');
    }
  };

  const openReason = (text: string): void => {
    setReasonText(text);
    setReasonOpen(true);
  };

  const columns: ColumnsType<RefundRequest> = useMemo(
    () => [
      { title: '票据ID', dataIndex: 'ticketId', key: 'ticketId', width: 220 },
      {
        title: '用户',
        dataIndex: ['userInfo', 'username'],
        key: 'userName',
        width: 160,
      },
      {
        title: '邮箱',
        dataIndex: ['userInfo', 'email'],
        key: 'email',
        width: 220,
      },
      {
        title: '演唱会',
        dataIndex: ['ticketInfo', 'concertName'],
        key: 'concertName',
      },
      {
        title: '价格',
        dataIndex: ['ticketInfo', 'price'],
        key: 'price',
        width: 100,
        render: (v: number) => `¥${v}`,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (v: RefundStatus) => <StatusTag kind="refund" value={v} />,
      },
      {
        title: '申请时间',
        dataIndex: 'requestTime',
        key: 'requestTime',
        width: 200,
      },
      {
        title: '操作',
        key: 'action',
        width: 260,
        render: (_, r) => (
          <Space>
            <Button onClick={() => openReason(r.reason)}>查看原因</Button>
            <Button
              type="primary"
              disabled={r.status !== 'pending'}
              onClick={() => askNoteAndReview(r.ticketId, true)}
            >
              通过
            </Button>
            <Button
              danger
              disabled={r.status !== 'pending'}
              onClick={() => askNoteAndReview(r.ticketId, false)}
            >
              拒绝
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => void fetch()}>刷新</Button>
      </Space>
      <Table<RefundRequest>
        rowKey={(r) => `${r.ticketId}-${r.userId}`}
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="填写审核意见"
        open={noteOpen}
        onCancel={() => setNoteOpen(false)}
        onOk={() => void submitReview()}
        okText="提交审核"
      >
        <Input.TextArea
          rows={4}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          maxLength={200}
          showCount
          style={{ marginBottom: 16 }}
          placeholder="记录通过/拒绝的理由"
        />
      </Modal>

      <Modal
        title="用户退票原因"
        open={reasonOpen}
        onCancel={() => setReasonOpen(false)}
        onOk={() => setReasonOpen(false)}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {reasonText || '-'}
        </div>
      </Modal>
    </>
  );
}
