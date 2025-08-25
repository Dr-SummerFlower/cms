import { Html5Qrcode, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import type { CSSProperties } from 'react';
import { useEffect, useId, useRef } from 'react';

interface Html5QrScannerProps {
  active: boolean;
  deviceId?: string;
  onDecoded: (text: string) => void;
  onError?: (error: string) => void;
  qrbox?: Html5QrcodeCameraScanConfig['qrbox'];
  className?: string;
  style?: CSSProperties;
  fps?: number;
}

export default function Html5QrScanner(props: Html5QrScannerProps): JSX.Element {
  const {
    active,
    deviceId,
    onDecoded,
    onError,
    qrbox = 250,
    className,
    style,
    fps = 10,
  } = props;

  const domId = useId().replace(/:/g, '_');
  const qrcodeRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef<boolean>(false);

  useEffect(() => {
    const ensure = (): Html5Qrcode => {
      if (qrcodeRef.current) return qrcodeRef.current;
      qrcodeRef.current = new Html5Qrcode(domId,false);
      return qrcodeRef.current;
    };

    const start = (): void => {
      if (runningRef.current) return;
      const inst = ensure();

      const config: Html5QrcodeCameraScanConfig = {
        fps,
        qrbox,
        aspectRatio: 16 / 9,
      };

      const cameraConfig = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' as const };

      inst.start(
        cameraConfig,
        config,
        (decodedText: string) => {
          onDecoded(decodedText.trim());
        },
        (e: string) => {
          if (onError) onError(e);
        },
      );
      runningRef.current = true;
    };

    const stop = (): void => {
      if (!qrcodeRef.current || !runningRef.current) return;
      try {
        qrcodeRef.current.stop();
        qrcodeRef.current.clear();
      } catch (error) {
        console.warn('QR Scanner stop error:', error);
      } finally {
        runningRef.current = false;
      }
    };

    if (active) {
      void start();
    } else {
      void stop();
    }

    return () => {
      if (qrcodeRef.current) {
        try {
          if (runningRef.current) {
            qrcodeRef.current.stop();
          }
          qrcodeRef.current.clear();
        } catch (error) {
          console.warn('QR Scanner cleanup error:', error);
        } finally {
          qrcodeRef.current = null;
          runningRef.current = false;
        }
      }
    };
  }, [active, deviceId, fps, onDecoded, onError, qrbox, domId]);

  return (
    <div
      id={domId}
      className={className}
      style={{
        width: '100%',
        minHeight: 240,
        background: '#000',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}
