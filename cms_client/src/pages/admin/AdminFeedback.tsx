import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import {
  deleteFeedback,
  getFeedbackById,
  getFeedbackList,
  updateFeedbackStatus,
} from "../../api/feedback";
import type {
  ErrorType,
  Feedback,
  FeedbackListResponse,
  FeedbackQueryDto,
  FeedbackStatus,
} from "../../types";

const { Search } = Input;
const { Text, Paragraph } = Typography;

export default function AdminFeedback(): JSX.Element {
  const { message } = AntdApp.useApp();
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<FeedbackQueryDto>({
    page: 1,
    limit: 10,
  });

  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detail, setDetail] = useState<Feedback | null>(null);

  const fetch = useCallback(
    async (queryParams: FeedbackQueryDto): Promise<void> => {
      setLoading(true);
      try {
        const res = await getFeedbackList(queryParams);
        setData(res);
      } catch {
        message.error("获取错误反馈列表失败");
      } finally {
        setLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    void fetch(query);
  }, [fetch, query]);

  const openDetail = async (id: string): Promise<void> => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const feedback = await getFeedbackById(id);
      setDetail(feedback);
    } catch {
      message.error("获取错误反馈详情失败");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: FeedbackStatus,
  ): Promise<void> => {
    try {
      await updateFeedbackStatus(id, status);
      message.success("状态更新成功");
      void fetch(query);
      if (detail && detail.id === id) {
        setDetail({ ...detail, status });
      }
    } catch {
      message.error("状态更新失败");
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await deleteFeedback(id);
      message.success("删除成功");
      void fetch(query);
      if (detail && detail.id === id) {
        setDetailOpen(false);
        setDetail(null);
      }
    } catch {
      message.error("删除失败");
    }
  };

  const getErrorTypeColor = (type: ErrorType): string => {
    switch (type) {
      case "route_error":
        return "red";
      case "runtime_error":
        return "orange";
      case "string_error":
        return "blue";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: FeedbackStatus): string => {
    switch (status) {
      case "pending":
        return "orange";
      case "resolved":
        return "green";
      case "ignored":
        return "gray";
      default:
        return "default";
    }
  };

  const getStatusText = (status: FeedbackStatus): string => {
    switch (status) {
      case "pending":
        return "待处理";
      case "resolved":
        return "已解决";
      case "ignored":
        return "已忽略";
      default:
        return status;
    }
  };

  const getErrorTypeText = (type: ErrorType): string => {
    switch (type) {
      case "route_error":
        return "路由错误";
      case "runtime_error":
        return "运行时错误";
      case "string_error":
        return "字符串错误";
      case "unknown":
        return "未知错误";
      default:
        return type;
    }
  };

  const columns: ColumnsType<Feedback> = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 160,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: "错误类型",
      dataIndex: "errorType",
      key: "errorType",
      width: 120,
      render: (type: ErrorType) => (
        <Tag color={getErrorTypeColor(type)}>{getErrorTypeText(type)}</Tag>
      ),
      filters: [
        { text: "路由错误", value: "route_error" },
        { text: "运行时错误", value: "runtime_error" },
        { text: "字符串错误", value: "string_error" },
        { text: "未知错误", value: "unknown" },
      ],
    },
    {
      title: "错误消息",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (message: string) => (
        <Text ellipsis={{ tooltip: message }} style={{ maxWidth: 300 }}>
          {message}
        </Text>
      ),
    },
    {
      title: "页面URL",
      dataIndex: "url",
      key: "url",
      width: 200,
      ellipsis: true,
      render: (url: string) => (
        <Text ellipsis={{ tooltip: url }} style={{ maxWidth: 180 }}>
          {url}
        </Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: FeedbackStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: "待处理", value: "pending" },
        { text: "已解决", value: "resolved" },
        { text: "已忽略", value: "ignored" },
      ],
    },
    {
      title: "操作",
      key: "action",
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button size="small" onClick={() => openDetail(record.id)}>
            详情
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 90 }}
            onChange={(status: FeedbackStatus) =>
              updateStatus(record.id, status)
            }
          >
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="ignored">已忽略</Select.Option>
          </Select>
          <Popconfirm
            title="确定要删除这条反馈吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
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
    <div>
      <Card title="错误反馈管理" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索错误消息、URL或用户代理"
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => setQuery({ ...query, search: value, page: 1 })}
          />
          <Select
            placeholder="错误类型"
            allowClear
            style={{ width: 120 }}
            onChange={(errorType) => setQuery({ ...query, errorType, page: 1 })}
          >
            <Select.Option value="route_error">路由错误</Select.Option>
            <Select.Option value="runtime_error">运行时错误</Select.Option>
            <Select.Option value="string_error">字符串错误</Select.Option>
            <Select.Option value="unknown">未知错误</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 100 }}
            onChange={(status) => setQuery({ ...query, status, page: 1 })}
          >
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="ignored">已忽略</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) =>
              setQuery({ ...query, page, limit: pageSize }),
          }}
          locale={{
            emptyText: <Empty description="暂无错误反馈" />,
          }}
        />
      </Card>

      <Drawer
        title="错误反馈详情"
        placement="right"
        width={600}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          detail && (
            <Space>
              <Select
                value={detail.status}
                style={{ width: 100 }}
                onChange={(status: FeedbackStatus) =>
                  updateStatus(detail.id, status)
                }
              >
                <Select.Option value="pending">待处理</Select.Option>
                <Select.Option value="resolved">已解决</Select.Option>
                <Select.Option value="ignored">已忽略</Select.Option>
              </Select>
              <Popconfirm
                title="确定要删除这条反馈吗？"
                onConfirm={() => handleDelete(detail.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {detailLoading ? (
          <Skeleton active />
        ) : detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="错误时间">
              {new Date(detail.timestamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="错误类型">
              <Tag color={getErrorTypeColor(detail.errorType)}>
                {getErrorTypeText(detail.errorType)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(detail.status)}>
                {getStatusText(detail.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="页面URL">
              <Text copyable>{detail.url}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="用户代理">
              <Paragraph copyable ellipsis={{ rows: 2, expandable: true }}>
                {detail.userAgent}
              </Paragraph>
            </Descriptions.Item>
            <Descriptions.Item label="错误消息">
              <Paragraph copyable ellipsis={{ rows: 3, expandable: true }}>
                {detail.message}
              </Paragraph>
            </Descriptions.Item>
            {detail.stack && (
              <Descriptions.Item label="错误堆栈">
                <Paragraph
                  copyable
                  code
                  ellipsis={{ rows: 10, expandable: true }}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {detail.stack}
                </Paragraph>
              </Descriptions.Item>
            )}
            {detail.routeStatus && (
              <Descriptions.Item label="路由状态">
                {detail.routeStatus} - {detail.routeStatusText}
              </Descriptions.Item>
            )}
            {detail.routeData && (
              <Descriptions.Item label="路由数据">
                <Paragraph
                  copyable
                  code
                  ellipsis={{ rows: 5, expandable: true }}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(detail.routeData, null, 2);
                    } catch {
                      return "数据格式错误";
                    }
                  })()}
                </Paragraph>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="创建时间">
              {new Date(detail.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(detail.updatedAt).toLocaleString()}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </div>
  );
}
