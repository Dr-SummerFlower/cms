import { App as AntdApp, Button, Popconfirm, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { createConcert, deleteConcert, listConcerts, updateConcert, updateConcertPoster } from '../../api/concerts';
import type { Concert, CreateConcertDto } from '../../types';
import ConcertFormModal from './ConcertFormModal';

export default function AdminConcerts(): JSX.Element {
  const [rows, setRows] = useState<ReadonlyArray<Concert>>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Concert | null>(null);
  const { message } = AntdApp.useApp();

  const fetch = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await listConcerts({ page: 1, limit: 100 });
      setRows(res.items);
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
        <Button type="primary" onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}>新建</Button>
        <Button onClick={() => void fetch()}>刷新</Button>
      </Space>
      <Table<Concert>
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={[
          { title: '名称', dataIndex: 'name' },
          { title: '时间', dataIndex: 'date' },
          { title: '场馆', dataIndex: 'venue' },
          { title: '成人/儿童票价', render: (_, r) => `¥${r.adultPrice} / ¥${r.childPrice}` },
          { title: '总票数', dataIndex: 'totalTickets', width: 100 },
          { title: '状态', dataIndex: 'status', render: (s) => <Tag>{s}</Tag> },
          {
            title: '操作',
            width: 220,
            render: (_, r) => (
              <Space>
                <Button size="small" onClick={() => {
                  setEditing(r);
                  setModalOpen(true);
                }}>编辑</Button>
                <Popconfirm title="确认删除？" onConfirm={async () => {
                  try {
                    await deleteConcert(r.id);
                    message.success('已删除');
                    void fetch();
                  } catch {
                    message.error('删除失败');
                  }
                }}>
                  <Button size="small" danger>删除</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <ConcertFormModal
        open={modalOpen}
        initial={editing ?? undefined}
        onCancel={() => setModalOpen(false)}
        onOk={async (dto: CreateConcertDto, poster?: File) => {
          try {
            if (editing) {
              await updateConcert(editing.id, dto);
              if (poster) await updateConcertPoster(editing.id, poster);
            } else {
              await createConcert(dto, poster);
            }
            setModalOpen(false);
            message.success('保存成功');
            void fetch();
          } catch {
            message.error('保存失败');
          }
        }}
      />
    </>
  );
}
