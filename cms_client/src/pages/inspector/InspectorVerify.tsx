import {Alert, App as AntdApp, Button, Card, Descriptions, Image, Input, Modal, Select, Space, Typography,} from "antd";
import {Html5Qrcode} from "html5-qrcode";
import {useCallback, useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {confirmVerification, verifyTicket} from "../../api/verify";
import {VerifyResultTag} from "../../components/common/StatusTag";
import Html5QrScanner from "../../components/qrcode/Html5QrScanner";
import type {VerifyTicketResponse} from "../../types";
import {getImageUrl} from "../../utils/image";

type ScanState = "idle" | "ready" | "scanning" | "denied" | "error";

interface CameraDevice {
  id: string;
  label: string;
}

export default function InspectorVerify(): JSX.Element {
  const {message} = AntdApp.useApp();

  const [locationText, setLocationText] = useState<string>("");
  const [manualQr, setManualQr] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [cameras, setCameras] = useState<ReadonlyArray<CameraDevice>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [active, setActive] = useState<boolean>(false);

  const [lastResult, setLastResult] = useState<VerifyTicketResponse | null>(
    null,
  );
  const [warn, setWarn] = useState<string>("");
  const [verificationModalVisible, setVerificationModalVisible] =
    useState<boolean>(false);
  const [pendingVerification, setPendingVerification] =
    useState<VerifyTicketResponse | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [wasFromScan, setWasFromScan] = useState<boolean>(false);

  useEffect(() => {
    setLocationText(localStorage.getItem("verifyLocation") ?? "");
  }, []);

  const saveLocation = useCallback((): void => {
    const v = locationText.trim();
    if (!v) {
      message.error("请填写验票地点");
      return;
    }
    localStorage.setItem("verifyLocation", v);
    message.success("已保存验票地点");
  }, [locationText, message]);

  const refreshCameras = useCallback(async (): Promise<void> => {
    try {
      const list = await Html5Qrcode.getCameras();
      const result: ReadonlyArray<CameraDevice> = (list ?? []).map((d) => ({
        id: d.id,
        label: d.label,
      }));
      setCameras(result);
      if (result.length > 0 && !selectedDeviceId) {
        const rear = result.find((d) => /back|rear|environment/i.test(d.label));
        setSelectedDeviceId(rear?.id ?? result[0].id);
      }
      setScanState("ready");
    } catch {
      setScanState("error");
      setWarn("无法枚举摄像头，请确认已授予权限或使用支持的浏览器。");
    }
  }, [selectedDeviceId]);

  const preAuthorize = useCallback(async (): Promise<void> => {
    try {
      await navigator.mediaDevices.getUserMedia({video: true, audio: false});
      await refreshCameras();
      message.success("已授权摄像头");
    } catch {
      setScanState("denied");
      message.error("授权失败");
    }
  }, [message, refreshCameras]);

  const deviceOptions = useMemo(
    () => cameras.map((d) => ({label: d.label || "摄像头", value: d.id})),
    [cameras],
  );

  const stopScan = useCallback((): void => {
    setActive(false);
    setScanState("ready");
  }, []);

  const startScan = useCallback(async (): Promise<void> => {
    if (!locationText.trim()) {
      message.error("请先填写并保存验票地点");
      return;
    }
    if (!selectedDeviceId) {
      await refreshCameras();
      if (!selectedDeviceId && cameras.length === 0) return;
    }
    setWarn("");
    setActive(true);
    setScanState("scanning");
  }, [cameras.length, locationText, message, refreshCameras, selectedDeviceId]);

  const doVerify = useCallback(
    async (qrData: string, isFromScan: boolean = false): Promise<void> => {
      const loc = (localStorage.getItem("verifyLocation") ?? "").trim();
      if (!loc) {
        message.error("请先在页面顶部设置验票地点");
        return;
      }
      let data = qrData.trim();
      if (!data) {
        message.error("请提供二维码数据");
        return;
      }

      // 如果输入的是 JSON 字符串，尝试解析并提取 qrCodeData
      try {
        const parsed = JSON.parse(data);
        if (parsed.qrCodeData) {
          data = parsed.qrCodeData;
        } else if (parsed.ticketId && parsed.signature && parsed.timestamp) {
          // 如果直接是二维码数据对象，转换为字符串
          data = JSON.stringify(parsed);
        }
      } catch {
        // 不是 JSON，直接使用原始数据
      }

      setSubmitting(true);
      try {
        const res = await verifyTicket({qrData: data, location: loc});
        setLastResult(res);
        setWasFromScan(isFromScan);
        if (res.valid) {
          // 如果有实名信息（姓名、身份证或人脸图像），需要人工审核
          if (
            res.requiresManualVerification ||
            res.ticket.realName ||
            res.ticket.idCard ||
            res.ticket.faceImage
          ) {
            // 需要人工审核，显示弹窗
            setPendingVerification(res);
            setVerificationModalVisible(true);
            if (isFromScan) {
              stopScan();
            }
          } else {
            message.success("验票成功");
            // 只有从扫描触发时才自动重启扫描
            if (isFromScan) {
              setTimeout(() => {
                setActive(true);
                setScanState("scanning");
              }, 3000);
            }
          }
        } else {
          message.warning("验票失败");
          // 只有从扫描触发时才自动重启扫描
          if (isFromScan) {
            setTimeout(() => {
              setActive(true);
              setScanState("scanning");
            }, 3000);
          }
        }
        setManualQr("");
      } catch {
        message.error("验票失败");
        // 只有从扫描触发时才自动重启扫描
        if (isFromScan) {
          setTimeout(() => {
            setActive(true);
            setScanState("scanning");
          }, 3000);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [message, stopScan],
  );

  const handleConfirmVerification = useCallback(async (): Promise<void> => {
    if (!pendingVerification) return;
    const shouldRestart = wasFromScan;
    setConfirming(true);
    try {
      await confirmVerification(pendingVerification.ticket.id);
      message.success("验票确认成功");
      setVerificationModalVisible(false);
      setPendingVerification(null);
      setLastResult({
        ...pendingVerification,
        ticket: {
          ...pendingVerification.ticket,
          status: "used",
        },
      });
      // 只有从扫描触发时才自动重启扫描
      if (shouldRestart) {
        setTimeout(() => {
          setActive(true);
          setScanState("scanning");
        }, 2000);
      }
    } catch {
      message.error("确认失败，请稍后重试");
    } finally {
      setConfirming(false);
    }
  }, [message, pendingVerification, wasFromScan]);

  const handleCancelVerification = useCallback((): void => {
    const shouldRestart = wasFromScan;
    setVerificationModalVisible(false);
    setPendingVerification(null);
    // 只有从扫描触发时才自动重启扫描
    if (shouldRestart) {
      setTimeout(() => {
        setActive(true);
        setScanState("scanning");
      }, 500);
    }
  }, [wasFromScan]);

  return (
    <Card
      title={
        <Space>
          <span>验票</span>
          <Typography.Text type="secondary">
            <Link to="/inspector/history">查看验票记录</Link>
          </Typography.Text>
        </Space>
      }
    >
      <Space align="center" wrap style={{marginBottom: 12}}>
        <span style={{color: "#999"}}>验票地点</span>
        <Input
          style={{width: 260}}
          placeholder="例如：东门闸机 / 看台A入口"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          onPressEnter={saveLocation}
        />
        <Button type="primary" onClick={saveLocation}>
          保存地点
        </Button>
      </Space>

      <Space align="center" wrap style={{marginBottom: 8}}>
        <Select
          placeholder="选择摄像头"
          style={{width: 280}}
          options={deviceOptions}
          value={selectedDeviceId || undefined}
          onChange={(v) => setSelectedDeviceId(v)}
          onOpenChange={(open) => {
            if (open) void refreshCameras();
          }}
        />
        {(scanState === "idle" ||
          scanState === "denied" ||
          scanState === "error") && (
          <Button onClick={() => void preAuthorize()}>授权摄像头</Button>
        )}
        {!active ? (
          <Button type="primary" onClick={() => void startScan()}>
            开始扫码
          </Button>
        ) : (
          <Button danger onClick={stopScan}>
            停止
          </Button>
        )}
        <Typography.Text type="secondary">
          状态：
          {scanState === "scanning"
            ? "扫描中"
            : scanState === "ready"
              ? "就绪"
              : scanState === "denied"
                ? "已拒绝"
                : scanState === "error"
                  ? "错误"
                  : "待开始"}
        </Typography.Text>
      </Space>

      {warn && (
        <Alert
          type="warning"
          message={warn}
          showIcon
          style={{marginBottom: 12}}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 420px) 1fr",
          gap: 16,
          alignItems: "start",
          marginBottom: 16,
        }}
      >
        <Html5QrScanner
          active={active}
          deviceId={selectedDeviceId || undefined}
          onDecoded={(text) => {
            // 立即停止扫描，避免重复触发
            stopScan();
            // 延迟验证，确保扫描器已停止
            setTimeout(() => {
              void doVerify(text, true);
            }, 200);
          }}
          qrbox={280}
          fps={10}
          style={{minHeight: 260}}
        />

        <div>
          <Typography.Paragraph type="secondary">
            也可手动输入/粘贴二维码数据：
          </Typography.Paragraph>
          <Space.Compact style={{width: "100%"}}>
            <Input
              placeholder="输入或粘贴二维码数据"
              value={manualQr}
              onChange={(e) => setManualQr(e.target.value)}
              onPressEnter={() => void doVerify(manualQr, false)}
            />
            <Button
              type="primary"
              loading={submitting}
              onClick={() => void doVerify(manualQr, false)}
            >
              验证
            </Button>
          </Space.Compact>

          {lastResult && (
            <Card
              size="small"
              style={{marginTop: 12}}
              title="最近一次验票结果"
            >
              <Descriptions
                size="small"
                column={1}
                bordered
                items={[
                  {
                    key: "valid",
                    label: "结果",
                    children: lastResult.valid ? (
                      <VerifyResultTag result="valid"/>
                    ) : (
                      <VerifyResultTag result="invalid"/>
                    ),
                  },
                  {
                    key: "ticketId",
                    label: "票据ID",
                    children: lastResult.ticket.id,
                  },
                  {
                    key: "concert",
                    label: "演唱会",
                    children: lastResult.ticket.concertName,
                  },
                  {
                    key: "concertDate",
                    label: "演出时间",
                    children: new Date(
                      lastResult.ticket.concertDate,
                    ).toLocaleString("zh-CN"),
                  },
                  {
                    key: "concertVenue",
                    label: "演出地点",
                    children: lastResult.ticket.concertVenue,
                  },
                  {
                    key: "type",
                    label: "票据类型",
                    children:
                      lastResult.ticket.type === "adult" ? "成人票" : "儿童票",
                  },
                  {
                    key: "price",
                    label: "票价",
                    children: `¥${lastResult.ticket.price}`,
                  },
                  {
                    key: "userName",
                    label: "持票人",
                    children: lastResult.ticket.userName,
                  },
                  {
                    key: "userEmail",
                    label: "联系邮箱",
                    children: lastResult.ticket.userEmail,
                  },
                  {
                    key: "status",
                    label: "票据状态",
                    children:
                      lastResult.ticket.status === "valid"
                        ? "未使用"
                        : lastResult.ticket.status === "used"
                          ? "已使用"
                          : "已退款",
                  },
                  {
                    key: "user",
                    label: "购票人",
                    children: lastResult.ticket.userName,
                  },
                  {
                    key: "time",
                    label: "验证时间",
                    children: lastResult.verifiedAt,
                  },
                ]}
              />
            </Card>
          )}
        </div>
      </div>

      <Modal
        title="人工审核验票"
        open={verificationModalVisible}
        onOk={handleConfirmVerification}
        onCancel={handleCancelVerification}
        okText="确认通过"
        cancelText="取消"
        okButtonProps={{loading: confirming, type: "primary"}}
        width={600}
      >
        {pendingVerification && (
          <div>
            <Alert
              type="info"
              message="请核验以下信息"
              description="请核对人脸图像与持票人是否一致，以及实名信息与身份证是否匹配。"
              style={{marginBottom: 16}}
            />
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                {
                  key: "concert",
                  label: "演唱会",
                  children: pendingVerification.ticket.concertName,
                },
                {
                  key: "venue",
                  label: "演出地点",
                  children: pendingVerification.ticket.concertVenue,
                },
                {
                  key: "type",
                  label: "票据类型",
                  children:
                    pendingVerification.ticket.type === "adult"
                      ? "成人票"
                      : "儿童票",
                },
                {
                  key: "realName",
                  label: "购票人姓名",
                  children: pendingVerification.ticket.realName || "未填写",
                },
                {
                  key: "idCard",
                  label: "身份证号",
                  children: pendingVerification.ticket.idCard || "未填写",
                },
                {
                  key: "faceImage",
                  label: "人脸图像",
                  children: pendingVerification.ticket.faceImage ? (
                    <Image
                      src={getImageUrl(pendingVerification.ticket.faceImage)}
                      alt="人脸图像"
                      width={200}
                      style={{maxHeight: 200, objectFit: "contain"}}
                    />
                  ) : (
                    "未上传"
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
}
