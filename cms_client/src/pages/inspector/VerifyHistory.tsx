import { Button, Card, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { verifyHistory } from '../../api/verify';
import type { VerifyHistoryItem } from '../../types';

export default function VerifyHistory(): JSX.Element {
  const [rows, setRows] = useState<ReadonlyArray<VerifyHistoryItem>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRows = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const list = await verifyHistory();
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const columns: ColumnsType<VerifyHistoryItem> = useMemo(
    () => [
      {
        title: '演唱会',
        key: 'concert',
        width: 200,
        render: (record: VerifyHistoryItem) => record.ticket.concert.name,
      },
      {
        title: '票据类型',
        key: 'ticketType',
        width: 100,
        render: (record: VerifyHistoryItem) => record.ticket.type === 'adult' ? '成人票' : '儿童票',
      },
      {
        title: '票价',
        key: 'price',
        width: 100,
        render: (record: VerifyHistoryItem) => `¥${record.ticket.price}`,
      },
      {
        title: '持票人',
        key: 'ticketHolder',
        width: 120,
        render: (record: VerifyHistoryItem) => record.ticket.user.username,
      },
      {
        title: '检票员',
        key: 'inspector',
        width: 120,
        render: (record: VerifyHistoryItem) => record.inspector.username,
      },
      {
        title: '验票地点',
        dataIndex: 'location',
        key: 'location',
        width: 150,
      },
      {
        title: '验票结果',
        dataIndex: 'result',
        key: 'result',
        width: 100,
        render: (result: boolean) =>
          result ? <Tag color="green">验证通过</Tag> : <Tag color="red">验证失败</Tag>,
      },
      {
        title: '验票时间',
        dataIndex: 'verifiedAt',
        key: 'verifiedAt',
        width: 180,
        render: (time: string) => new Date(time).toLocaleString('zh-CN'),
      },
    ],
    [],
  );

  return (
    <Card title="验票记录" extra={<Link to="/inspector"><Button>返回</Button></Link>}>
      <Table<VerifyHistoryItem>
        rowKey={(r) => r._id}
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
