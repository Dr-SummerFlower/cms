import { Alert, App as AntdApp, Button, Card, Descriptions, Empty, Input, Space, Tag, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { verifyTicket } from '../../api/verify';
import type { BarcodeDetector, BarcodeDetectorConstructor, VerifyTicketResponse } from '../../types';

type Detector = BarcodeDetectorConstructor;

export default function InspectorVerify(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [detector, setDetector] = useState<Detector | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyTicketResponse | null>(null);
  const { message } = AntdApp.useApp();

  useEffect(() => {
    if ('BarcodeDetector' in window && window.BarcodeDetector) {
      try {
        const d = new window.BarcodeDetector({ formats: ['qr_code'] });
        setDetector(d as unknown as Detector);
      } catch { /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startCamera = async (): Promise<void> => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      if (detector) {
        setScanning(true);
        requestAnimationFrame(tick);
      } else {
        message.info('当前浏览器不支持自动扫码，请上传图片或手动输入');
      }
    } catch {
      message.error('无法访问摄像头');
    }
  };

  const tick = async (): Promise<void> => {
    if (!scanning || !detector || !videoRef.current) return;
    try {
      const codes = await (detector as unknown as BarcodeDetector).detect(videoRef.current);
      if (codes.length > 0) {
        const text = codes[0].rawValue ?? '';
        setScanning(false);
        await doVerify(text);
        return;
      }
    } catch { /* ignore */
    }
    requestAnimationFrame(tick);
  };

  const doVerify = async (qrData: string): Promise<void> => {
    try {
      const res = await verifyTicket({ qrData, location: 'mobile' });
      setResult(res);
    } catch {
      message.error('验票失败');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
      <Card title="扫码验证" style={{ width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <video ref={videoRef} style={{ width: '100%', maxHeight: 360, background: '#000' }} playsInline muted />
          <Space wrap>
            <Button type="primary" onClick={() => void startCamera()}>启动摄像头</Button>
            <Button onClick={() => setScanning((s) => !s)} disabled={!detector || !stream}>
              {scanning ? '暂停识别' : '继续识别'}
            </Button>
          </Space>

          <Typography.Text type="secondary">
            若自动扫码不可用，可手动粘贴二维码内容：
          </Typography.Text>
          <Input.Search
            allowClear
            placeholder="粘贴二维码文本/签名"
            enterButton="验证"
            onSearch={(val) => void doVerify(val.trim())}
          />
        </Space>
      </Card>

      <Card title="验证结果">
        {!result ? (
          <Empty description="尚无结果" />
        ) : result.valid ? (
          <>
            <Alert type="success" message="票据有效" showIcon style={{ marginBottom: 12 }} />
            <Descriptions bordered column={1} size="small" items={[
              { key: 'ticketId', label: '票据ID', children: result.ticket.id },
              { key: 'type', label: '类型', children: result.ticket.type === 'adult' ? '成人' : '儿童' },
              { key: 'status', label: '状态', children: <Tag color="green">{result.ticket.status}</Tag> },
              {
                key: 'verifiedAt',
                label: '验证时间',
                children: new Date(result.verificationRecord.verifiedAt).toLocaleString(),
              },
            ]} />
          </>
        ) : (
          <Alert type="error" message="票据无效或已使用/退款" showIcon />
        )}
      </Card>
    </div>
  );
}
