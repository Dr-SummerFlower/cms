import { Button, Card, Input, message, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { verifyHistory, verifyTicket } from '../../api/verify';

type VerifyResult = {
  success: boolean;
  message: string;
};

type VerifyHistoryItem = {
  id: string;
  ticketId: string;
  status: 'valid' | 'invalid';
  message?: string;
  verifiedAt: string;
};

export default function InspectorVerify(): JSX.Element {
  const [location, setLocation] = useState<string>('');
  const [manualQr, setManualQr] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [history, setHistory] = useState<VerifyHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('verifyLocation') ?? '';
    setLocation(saved);
    void loadHistory();
  }, []);

  const saveLocation = (): void => {
    const v = location.trim();
    if (!v) {
      message.error('请填写验票地点');
      return;
    }
    localStorage.setItem('verifyLocation', v);
    message.success('已保存验票地点');
  };

  const loadHistory = async (): Promise<void> => {
    setLoadingHistory(true);
    try {
      const list = await verifyHistory();
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const doVerify = async (qrData: string): Promise<void> => {
    const loc = (localStorage.getItem('verifyLocation') ?? '').trim();
    if (!loc) {
      message.error('请先在页面顶部设置验票地点');
      return;
    }
    if (!qrData.trim()) {
      message.error('请提供二维码数据');
      return;
    }
    setSubmitting(true);
    try {
      const res = (await verifyTicket({
        qrData,
        location: loc,
      })) as unknown as VerifyResult;
      if (res?.success) {
        message.success(res.message || '验票成功');
        setManualQr('');
        await loadHistory();
      } else {
        message.error(res?.message || '验票失败');
      }
    } catch {
      message.error('验票失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<VerifyHistoryItem> = useMemo(
    () => [
      { title: '票据ID', dataIndex: 'ticketId', key: 'ticketId', width: 220 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (v: VerifyHistoryItem['status']) =>
          v === 'valid' ? (
            <Tag color="green">验证通过</Tag>
          ) : (
            <Tag color="red">验证失败</Tag>
          ),
      },
      { title: '信息', dataIndex: 'message', key: 'message', ellipsis: true },
      { title: '时间', dataIndex: 'verifiedAt', key: 'verifiedAt', width: 200 },
    ],
    [],
  );

  return (
    <Card title="验票">
      <Space align="center" style={{ marginBottom: 12 }}>
        <span style={{ color: '#999' }}>验票地点</span>
        <Input
          style={{ width: 260 }}
          placeholder="例如：东门闸机 / 看台A入口"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onPressEnter={saveLocation}
        />
        <Button type="primary" onClick={saveLocation}>
          保存地点
        </Button>
      </Space>

      <Space align="center" style={{ marginBottom: 16 }}>
        <Input
          style={{ width: 360 }}
          placeholder="输入或粘贴二维码数据"
          value={manualQr}
          onChange={(e) => setManualQr(e.target.value)}
          onPressEnter={() => void doVerify(manualQr)}
        />
        <Button
          type="primary"
          loading={submitting}
          onClick={() => void doVerify(manualQr)}
        >
          验证
        </Button>
      </Space>

      <Table<VerifyHistoryItem>
        rowKey="id"
        columns={columns}
        dataSource={history}
        loading={loadingHistory}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
