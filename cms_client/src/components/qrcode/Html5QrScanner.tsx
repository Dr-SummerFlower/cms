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
  const stoppingRef = useRef<boolean>(false);

  useEffect(() => {
    const ensure = (): Html5Qrcode => {
      if (qrcodeRef.current) return qrcodeRef.current;
      qrcodeRef.current = new Html5Qrcode(domId, false);
      return qrcodeRef.current;
    };

    const stop = async (): Promise<void> => {
      if (stoppingRef.current) return;

      stoppingRef.current = true;

      try {
        // 先停止扫描器实例（这会停止扫描但可能不会立即释放摄像头）
        if (qrcodeRef.current && runningRef.current) {
          try {
            await qrcodeRef.current.stop().catch(() => {
            });
          } catch {
            // 忽略停止错误
          }
        }

        // 强制停止所有媒体流（确保摄像头完全释放）
        const container = document.getElementById(domId);
        if (container) {
          const videoElements = container.querySelectorAll('video');
          videoElements.forEach((video) => {
            const stream = video.srcObject as MediaStream;
            if (stream) {
              stream.getTracks().forEach((track) => {
                track.stop();
              });
            }
            video.srcObject = null;
          });
        }

        // 清理 DOM（这会移除所有元素）
        if (qrcodeRef.current) {
          try {
            qrcodeRef.current.clear();
          } catch {
            // 忽略清理错误
          }
        }
      } catch (error) {
        console.warn('QR Scanner stop error:', error);
      } finally {
        runningRef.current = false;
        stoppingRef.current = false;
      }
    };

    const start = async (): Promise<void> => {
      // 如果正在停止，等待停止完成
      if (stoppingRef.current) {
        await new Promise((resolve) => {
          const checkStop = setInterval(() => {
            if (!stoppingRef.current) {
              clearInterval(checkStop);
              resolve(undefined);
            }
          }, 50);
        });
      }

      if (runningRef.current) return;

      // 确保先停止之前的实例
      await stop();

      const inst = ensure();

      const config: Html5QrcodeCameraScanConfig = {
        fps,
        qrbox,
        aspectRatio: 16 / 9,
      };

      const cameraConfig = deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' as const };

      try {
        await inst.start(
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
      } catch (error) {
        console.warn('QR Scanner start error:', error);
        runningRef.current = false;
        if (onError) onError(String(error));
      }
    };

    if (active) {
      void start();
    } else {
      // 立即停止，不等待
      void stop();
    }

    return () => {
      const cleanup = async (): Promise<void> => {
        await stop();
        qrcodeRef.current = null;
        runningRef.current = false;
        stoppingRef.current = false;
      };
      void cleanup();
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
