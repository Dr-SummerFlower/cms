import { App as AntdApp, Button, Select, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { listUsers, updateUserRole } from '../../api/users';
import type { Paginated, Role, User } from '../../types';

export default function AdminUsers(): JSX.Element {
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();

  const fetch = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await listUsers({ page: 1, limit: 100 });
      setData(res);
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
      <Table<User>
        rowKey="id"
        loading={loading}
        dataSource={data?.items ?? []}
        columns={[
          { title: '用户名', dataIndex: 'username' },
          { title: '邮箱', dataIndex: 'email' },
          {
            title: '角色',
            dataIndex: 'role',
            render: (r: Role) => <Tag color={r === 'ADMIN' ? 'gold' : r === 'INSPECTOR' ? 'blue' : 'green'}>{r}</Tag>,
          },
          {
            title: '设置角色',
            render: (_, row) => (
              <Select<Role>
                value={row.role}
                style={{ width: 160 }}
                onChange={async (val) => {
                  try {
                    await updateUserRole(row.id, val);
                    message.success('已更新角色');
                    void fetch();
                  } catch {
                    message.error('更新失败');
                  }
                }}
                options={[
                  { label: '普通用户', value: 'USER' },
                  { label: '验票员', value: 'INSPECTOR' },
                  { label: '管理员', value: 'ADMIN' },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
