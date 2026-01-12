import { ReloadOutlined } from "@ant-design/icons";
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Progress,
  Space,
  Typography,
} from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ticketDetail, ticketQr } from "../api/tickets";
import StatusTag from "../components/common/StatusTag.tsx";
import type { TicketItem, TicketQr as TicketQrType } from "../types";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const { Text } = Typography;

export default function TicketDetail(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { message } = AntdApp.useApp();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [qr, setQr] = useState<{ png?: string; data?: string }>({});
  const [qrInfo, setQrInfo] = useState<TicketQrType | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [smoothProgress, setSmoothProgress] = useState<number>(100);
  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const smoothProgressRef = useRef<number | null>(null);
  const refreshQrCodeRef = useRef<(() => Promise<void>) | null>(null);
  const lastErrorTimeRef = useRef<number>(0);
  const lastErrorMessageRef = useRef<string>("");
  const [isPageVisible, setIsPageVisible] = useState<boolean>(true);
  const messageRef = useRef(message);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  const showErrorMessage = useCallback((errorMessage: string) => {
    const now = Date.now();
    const timeSinceLastError = now - lastErrorTimeRef.current;
    const isSameMessage = lastErrorMessageRef.current === errorMessage;

    if (isSameMessage && timeSinceLastError < 10000) {
      return;
    }

    messageRef.current.error(errorMessage);
    lastErrorTimeRef.current = now;
    lastErrorMessageRef.current = errorMessage;
  }, []);

  const refreshQrCode = useCallback(async () => {
    if (!id || isRefreshingRef.current) {
      return;
    }
    try {
      isRefreshingRef.current = true;
      setButtonLoading(true);
      const res: TicketQrType = await ticketQr(id);
      const dataStr = JSON.stringify(res.data ?? {});
      setQr({ png: res.qrCode, data: dataStr });
      setQrInfo(res);
      setCountdown(Math.floor((res.refreshInterval || 30000) / 1000));
      setSmoothProgress(100);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError?.response?.data?.message || "刷新二维码失败";
      showErrorMessage(errorMessage);
      // 发生错误时清除定时器，避免继续刷新
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (smoothProgressRef.current) {
        clearInterval(smoothProgressRef.current);
        smoothProgressRef.current = null;
      }
    } finally {
      isRefreshingRef.current = false;
      setButtonLoading(false);
    }
  }, [id, showErrorMessage]);

  useEffect(() => {
    refreshQrCodeRef.current = refreshQrCode;
  }, [refreshQrCode]);

  const loadTicketDetail = useCallback(async () => {
    if (!id) return;
    try {
      const t = await ticketDetail(id);
      setTicket(t);
      if (!isRefreshingRef.current) {
        await refreshQrCode();
      }
    } catch {
      messageRef.current.error("加载票据详情失败");
    }
  }, [id, refreshQrCode]);

  useEffect(() => {
    loadTicketDetail();
  }, [loadTicketDetail]);

  // 设置自动刷新定时器
  useEffect(() => {
    if (!qrInfo?.refreshInterval || !isPageVisible) return;

    // 清除之前的定时器
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    if (smoothProgressRef.current) {
      clearInterval(smoothProgressRef.current);
    }

    // 设置刷新定时器（后端返回的已经是毫秒）
    intervalRef.current = setInterval(() => {
      if (refreshQrCodeRef.current) {
        refreshQrCodeRef.current();
      }
    }, qrInfo.refreshInterval);

    // 设置倒计时定时器
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return Math.floor((qrInfo.refreshInterval || 30000) / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    // 设置平滑进度计时器（每100毫秒更新一次）
    const totalMs = qrInfo.refreshInterval;
    const updateInterval = 100; // 100毫秒更新一次
    const decrementPerUpdate = (100 / totalMs) * updateInterval;

    smoothProgressRef.current = setInterval(() => {
      setSmoothProgress((prev) => {
        const newProgress = prev - decrementPerUpdate;
        if (newProgress <= 0) {
          return 100; // 重置为100%
        }
        return newProgress;
      });
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (smoothProgressRef.current) {
        clearInterval(smoothProgressRef.current);
      }
    };
  }, [qrInfo?.refreshInterval, isPageVisible]);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  if (!ticket) return <Card loading />;

  return (
    <Card
      title="票据详情"
      style={{ maxWidth: 960, margin: "0 auto" }}
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
          { key: "id", label: "票据ID", children: ticket.id },
          {
            key: "concert",
            label: "演唱会",
            children: ticket.concert?.name ?? "-",
          },
          {
            key: "type",
            label: "类型",
            children: ticket.type === "adult" ? "成人" : "儿童",
          },
          { key: "price", label: "价格", children: `¥${ticket.price}` },
          {
            key: "status",
            label: "状态",
            children: <StatusTag kind="ticket" value={ticket.status} />,
          },
          {
            key: "createdAt",
            label: "购买时间",
            children: ticket.createdAt ?? "-",
          },
        ]}
      />
      <Divider />
      <Space
        direction="vertical"
        size="middle"
        style={{ width: "100%", alignItems: "center" }}
      >
        {/* 动态二维码显示 */}
        {!!qr.png && (
          <img
            src={qr.png}
            alt="ticket-qr"
            style={{ width: 240, height: 240 }}
          />
        )}

        {/* 动态二维码状态指示器 */}
        {qrInfo?.refreshInterval && (
          <Space
            direction="vertical"
            size="small"
            style={{ alignItems: "center" }}
          >
            <Text type="secondary" style={{ fontSize: "12px" }}>
              动态二维码 · {countdown}秒后自动刷新
            </Text>
            <Progress
              percent={smoothProgress}
              size="small"
              showInfo={false}
              style={{ width: 200 }}
            />
            <Button
              type="link"
              size="small"
              icon={<ReloadOutlined />}
              loading={buttonLoading}
              onClick={refreshQrCode}
            >
              手动刷新
            </Button>
          </Space>
        )}
      </Space>
    </Card>
  );
}
