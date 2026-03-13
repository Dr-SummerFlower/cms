import {
  App as AntdApp,
  Button,
  Input,
  Modal,
  Segmented,
  Space,
  Table,
  Tooltip,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { refundTicket } from "../api/tickets";
import StatusTag from "../components/common/StatusTag.tsx";
import { useTicketStore } from "../stores/ticketStore";
import type { TicketItem } from "../types";

type StatusFilter = "all" | "valid" | "used" | "refunded";

export default function UserTickets(): JSX.Element {
  const { items, loading, fetch } = useTicketStore();
  const { message } = AntdApp.useApp();
  const [status, setStatus] = useState<StatusFilter>("all");
  const navigate = useNavigate();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundTicketId, setRefundTicketId] = useState<string | null>(null);

  const queryParam = useMemo(
    () => (status === "all" ? undefined : { status }),
    [status],
  );

  useEffect(() => {
    void fetch(queryParam);
  }, [fetch, queryParam]);

  const onRefund = (row: TicketItem): void => {
    setRefundTicketId(row.id);
    setRefundReason("");
    setRefundOpen(true);
  };

  const submitRefund = async (): Promise<void> => {
    if (!refundTicketId) return;
    const reason = refundReason.trim();
    if (!reason) {
      message.error("请填写退票原因");
      return;
    }
    try {
      await refundTicket(refundTicketId, reason);
      message.success("退票申请已提交");
      setRefundOpen(false);
      setRefundTicketId(null);
      setRefundReason("");
      void fetch(queryParam);
    } catch {
      message.error("退票申请失败");
    }
  };

  const columns = [
    { title: "票据ID", dataIndex: "id", key: "id", width: 220 },
    {
      title: "演唱会",
      key: "concert",
      render: (_: unknown, r: TicketItem) => r.concert?.name ?? "-",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (t: TicketItem["type"]) => (t === "adult" ? "成人" : "儿童"),
    },
    {
      title: "价格",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (v: number) => `¥${v}`,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (s: TicketItem["status"]) => (
        <StatusTag kind="ticket" value={s} />
      ),
    },
    { title: "购买时间", dataIndex: "createdAt", key: "createdAt", width: 200 },
    {
      title: "操作",
      key: "actions",
      width: 260,
      render: (_: unknown, r: TicketItem) => (
        <Space>
          <Button onClick={() => navigate(`/me/tickets/${r.id}`)}>
            查看详情
          </Button>
          <Tooltip title="仅未使用可申请退票">
            <Button
              danger
              disabled={r.status !== "valid"}
              onClick={() => onRefund(r)}
            >
              申请退票
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filterOptions = [
    { label: "全部", value: "all" },
    { label: "未使用", value: "valid" },
    { label: "已使用", value: "used" },
    { label: "已退款", value: "refunded" },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }}>
        <Segmented
          options={filterOptions}
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
        />
      </Space>
      <Table<TicketItem>
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={columns}
        pagination={false}
      />
      <Modal
        title="申请退票"
        open={refundOpen}
        onCancel={() => setRefundOpen(false)}
        onOk={() => void submitRefund()}
        okText="提交申请"
      >
        <div style={{ marginBottom: 8, color: "#999" }}>
          请填写退票原因（必填）
        </div>
        <Input.TextArea
          placeholder="例如：计划有变/行程冲突等"
          rows={4}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          maxLength={200}
          showCount
          style={{ marginBottom: 16 }}
        />
      </Modal>
    </>
  );
}
