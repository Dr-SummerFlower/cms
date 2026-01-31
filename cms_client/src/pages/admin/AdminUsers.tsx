import {App as AntdApp, Button, Descriptions, Drawer, Empty, Popconfirm, Select, Skeleton, Space, Table,} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useCallback, useEffect, useState} from "react";
import {deleteUser, getUser, listUsers, updateUserRole,} from "../../api/users";
import type {Paginated, Role, User} from "../../types";

export default function AdminUsers(): JSX.Element {
  const {message} = AntdApp.useApp();
  const [data, setData] = useState<Paginated<User> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detail, setDetail] = useState<User | null>(null);

  const fetch = useCallback(async (p: number, ps: number): Promise<void> => {
    setLoading(true);
    try {
      const res = await listUsers({page: p, limit: ps});
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch(1, pageSize);
    setPage(1);
  }, [fetch, pageSize]);

  const openDetail = async (id: string): Promise<void> => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const u = await getUser(id);
      setDetail(u);
    } catch {
      message.error("获取用户详情失败");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateRole = async (id: string, role: Role): Promise<void> => {
    try {
      await updateUserRole(id, role);
      message.success("已更新角色");
      await fetch(page, pageSize);
    } catch {
      message.error("更新失败");
    }
  };

  const columns: ColumnsType<User> = [
    {title: "用户名", dataIndex: "username", key: "username"},
    {title: "邮箱", dataIndex: "email", key: "email"},
    {
      title: "角色",
      key: "role",
      width: 260,
      render: (_, row) => (
        <Select<Role>
          value={row.role}
          onChange={(val) => void updateRole(row.id, val)}
          options={[
            {label: "普通用户", value: "USER"},
            {label: "验票员", value: "INSPECTOR"},
            {label: "管理员", value: "ADMIN"},
          ]}
          style={{width: 220}}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 260,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => void openDetail(row.id)}>
            查看
          </Button>
          <Popconfirm
            title="确认删除该用户？"
            okButtonProps={{danger: true}}
            onConfirm={async () => {
              try {
                await deleteUser(row.id);
                message.success("已删除");
                await fetch(page, pageSize);
              } catch {
                message.error("删除失败");
              }
            }}
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{marginBottom: 12}}>
        <Button onClick={() => void fetch(page, pageSize)}>刷新</Button>
      </Space>

      <Table<User>
        rowKey="id"
        loading={loading}
        dataSource={data?.items ?? []}
        columns={columns}
        pagination={{
          current: data?.page ?? page,
          pageSize: data?.limit ?? pageSize,
          total: data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
            void fetch(p, ps);
          },
        }}
      />

      <Drawer
        title="用户详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={520}
      >
        {detailLoading ? (
          <Skeleton active paragraph={{rows: 6}}/>
        ) : detail ? (
          <Descriptions
            column={1}
            bordered
            size="small"
            items={[
              {key: "id", label: "ID", children: detail.id},
              {key: "username", label: "用户名", children: detail.username},
              {key: "email", label: "邮箱", children: detail.email},
              {key: "role", label: "角色", children: detail.role},
              {
                key: "created",
                label: "注册时间",
                children: detail.createdAt ?? "-",
              },
              {
                key: "updated",
                label: "最近更新",
                children: detail.updatedAt ?? "-",
              },
            ]}
          />
        ) : (
          <Empty description="暂无数据"/>
        )}
      </Drawer>
    </>
  );
}
