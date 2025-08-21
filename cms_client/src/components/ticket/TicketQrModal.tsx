import { Modal, QRCode, Typography } from 'antd';
import type { TicketQr } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  qr?: TicketQr | null;
  qrData?: string;
}

export default function TicketQrModal({ open, onClose, qr, qrData }: Props): JSX.Element {
  const resolved = (() => {
    if (qrData) return qrData;
    if (qr?.data) {
      return JSON.stringify(qr.data);
    }
    return '';
  })();
  return (
    <Modal open={open} onCancel={onClose} onOk={onClose} title="电子票二维码" centered destroyOnClose>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        <QRCode value={resolved} size={240} />
      </div>
      {!!resolved && (
        <Typography.Paragraph copyable style={{ wordBreak: 'break-all' }}>
          数据：{resolved}
        </Typography.Paragraph>
      )}
    </Modal>
  );
}
