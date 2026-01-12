import { App as AntdApp, Button, Card, Form, Input, Space, Upload } from "antd";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as apiRegister, sendEmailCode } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import type { RegisterDto } from "../types";

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d~!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/]{8,32}$/;

export default function RegisterPage(): JSX.Element {
  const [form] = Form.useForm<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    code: string;
  }>();
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const applyAuth = useAuthStore((s) => s.applyAuth);

  const canSendCode = useMemo(
    () => countdown === 0 && !sending,
    [countdown, sending],
  );

  useEffect(
    () => () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    },
    [],
  );

  const onAvatarChange = async (
    info: UploadChangeParam<UploadFile>,
  ): Promise<void> => {
    const files = info.fileList.slice(-1);
    setUploadList(files);
    const raw = files[0]?.originFileObj;
    if (!raw) {
      setAvatarFile(undefined);
      return;
    }
    if (!raw.type.startsWith("image/")) {
      message.error("仅支持图片文件");
      setUploadList([]);
      setAvatarFile(undefined);
      return;
    }
    if (raw.size > 2 * 1024 * 1024) {
      message.error("图片大小不能超过 2MB");
      setUploadList([]);
      setAvatarFile(undefined);
      return;
    }
    setAvatarFile(raw);
  };

  const handleSendCode = async (): Promise<void> => {
    const email = form.getFieldValue("email") as string | undefined;
    if (!email) {
      message.warning("请先填写邮箱");
      return;
    }
    try {
      setSending(true);
      await sendEmailCode(email, "register");
      message.success("验证码已发送，请查收邮箱");
      setCountdown(60);
      timerRef.current = window.setInterval(
        () =>
          setCountdown((c) => {
            if (c <= 1) {
              window.clearInterval(timerRef.current!);
              return 0;
            }
            return c - 1;
          }),
        1000,
      );
    } catch {
      message.error("验证码发送失败");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card style={{ maxWidth: 480, margin: "48px auto" }} title="注册">
      <Form
        layout="vertical"
        form={form}
        onFinish={async (vals) => {
          if (vals.password !== vals.confirmPassword) {
            message.error("两次输入的密码不一致");
            return;
          }
          const dto: RegisterDto = {
            username: vals.username.trim(),
            email: vals.email.trim(),
            password: vals.password,
            code: vals.code.trim(),
          };
          try {
            setSubmitting(true);
            const res = await apiRegister(dto, avatarFile);
            applyAuth(res);
            message.success("注册成功，已自动登录");
            navigate("/", { replace: true });
          } catch {
            message.error("注册失败，请检查信息或稍后重试");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Form.Item label="头像（可选）">
          <Upload
            listType="picture-card"
            maxCount={1}
            fileList={uploadList}
            beforeUpload={() => false}
            onChange={(info) => {
              void onAvatarChange(info);
            }}
            onRemove={() => {
              setUploadList([]);
              setAvatarFile(undefined);
            }}
          >
            {uploadList.length >= 1 ? null : "上传头像"}
          </Upload>
        </Form.Item>

        <Form.Item
          label="用户名"
          name="username"
          rules={[{ required: true }, { min: 4, max: 20 }]}
        >
          <Input placeholder="4-20个字符" allowClear />
        </Form.Item>
        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ required: true }, { type: "email" }]}
        >
          <Input placeholder="you@example.com" allowClear />
        </Form.Item>
        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true },
            { pattern: PASSWORD_RULE, message: "8-32位，需大小写字母和数字" },
          ]}
          hasFeedback
        >
          <Input.Password placeholder="设置密码" />
        </Form.Item>
        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator(_, v?: string) {
                return !v || v === (getFieldValue("password") as string)
                  ? Promise.resolve()
                  : Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password placeholder="再次输入密码" />
        </Form.Item>

        <Form.Item
          label="邮箱验证码"
          name="code"
          rules={[
            { required: true },
            { len: 6 },
            { pattern: /^\d{6}$/, message: "验证码为6位数字" },
          ]}
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input placeholder="6位数字" maxLength={6} />
            <Button
              type="primary"
              onClick={() => void handleSendCode()}
              disabled={!canSendCode}
              loading={sending}
            >
              {countdown > 0 ? `${countdown}s后重发` : "发送验证码"}
            </Button>
          </Space.Compact>
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={submitting}>
          注册并登录
        </Button>
      </Form>
    </Card>
  );
}
