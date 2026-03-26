import {ReloadOutlined} from "@ant-design/icons";
import {Input, Space, theme as antdTheme} from "antd";
import React, {useCallback, useEffect, useImperativeHandle, useRef, useState,} from "react";
import {getCaptcha} from "../../api/auth";

export interface CaptchaInputRef {
  /** 获取当前验证码ID和用户输入的验证码 */
  getValue: () => { captchaId: string; captchaCode: string } | null;
  /** 刷新验证码 */
  refresh: () => Promise<void>;
  /** 清空输入 */
  clear: () => void;
}

export interface CaptchaInputProps {
  /** 外部样式类名 */
  className?: string;
  /** 验证码图片容器样式 */
  imageStyle?: React.CSSProperties;
  /** 输入框样式 */
  inputStyle?: React.CSSProperties;
  /** 容器样式 */
  containerStyle?: React.CSSProperties;
  /** 输入框占位符 */
  placeholder?: string;
  /** 输入框大小 */
  size?: "small" | "middle" | "large";
  /** 是否禁用 */
  disabled?: boolean;
  /** 验证码加载状态变化回调 */
  onLoadingChange?: (loading: boolean) => void;
  /** 验证码刷新回调 */
  onRefresh?: () => void;
  /** 验证码获取错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 验证码输入组件
 * 样式由外部通过 className 和 style 属性控制
 */
export const CaptchaInput = React.forwardRef<
  CaptchaInputRef,
  CaptchaInputProps
>(
  (
    {
      className,
      imageStyle,
      inputStyle,
      containerStyle,
      placeholder = "请输入验证码",
      size = "middle",
      disabled = false,
      onLoadingChange,
      onRefresh,
      onError,
    },
    ref,
  ) => {
    const {token} = antdTheme.useToken();
    const [captchaId, setCaptchaId] = useState<string>("");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<React.ComponentRef<typeof Input>>(null);
    const imageUrlRef = useRef<string>("");

    const loadCaptcha = useCallback(async (): Promise<void> => {
      setLoading(true);
      onLoadingChange?.(true);
      try {
        const {id, image} = await getCaptcha();
        setCaptchaId(id);
        const blob = new Blob([image], {type: "image/png"});
        const url = URL.createObjectURL(blob);
        if (imageUrlRef.current) {
          URL.revokeObjectURL(imageUrlRef.current);
        }
        imageUrlRef.current = url;
        setImageUrl(url);
        onRefresh?.();
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error("获取验证码失败");
        onError?.(err);
        console.error("获取验证码失败:", err);
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    }, [onLoadingChange, onRefresh, onError]);

    useEffect(() => {
      loadCaptcha();
      return () => {
        if (imageUrlRef.current) {
          URL.revokeObjectURL(imageUrlRef.current);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      getValue: () => {
        if (!captchaId || !inputValue.trim()) {
          return null;
        }
        return {captchaId, captchaCode: inputValue.trim()};
      },
      refresh: async () => {
        setInputValue("");
        await loadCaptcha();
      },
      clear: () => {
        setInputValue("");
      },
    }));

    return (
      <Space.Compact className={className} style={containerStyle} block>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          size={size}
          disabled={disabled || loading}
          style={inputStyle}
          maxLength={10}
        />
        <div
          onClick={disabled || loading ? undefined : () => loadCaptcha()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled || loading ? "not-allowed" : "pointer",
            border: `1px solid ${token.colorBorder}`,
            borderLeft: "none",
            backgroundColor: token.colorBgContainer,
            opacity: loading ? 0.6 : 1,
            transition: "background-color 0.2s",
            ...imageStyle,
          }}
          onMouseEnter={(e) => {
            if (!disabled && !loading) {
              e.currentTarget.style.backgroundColor = token.colorFillSecondary;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = token.colorBgContainer;
          }}
        >
          {loading ? (
            <ReloadOutlined spin style={{fontSize: 16, padding: "0 8px"}}/>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="验证码"
              style={{
                maxHeight: "100%",
                maxWidth: "100%",
                height: "auto",
                width: "auto",
                display: "block",
                userSelect: "none",
              }}
              draggable={false}
              onError={() => {
                console.error("验证码图片加载失败");
              }}
            />
          ) : (
            <ReloadOutlined style={{fontSize: 16, padding: "0 8px"}}/>
          )}
        </div>
      </Space.Compact>
    );
  },
);

CaptchaInput.displayName = "CaptchaInput";
