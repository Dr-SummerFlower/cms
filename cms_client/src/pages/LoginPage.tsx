import { App as AntdApp, Button, Card, Form, Input } from 'antd';
import axios from 'axios';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaptchaInput, type CaptchaInputRef } from '../components/common/CaptchaInput';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const { message } = AntdApp.useApp();
  const captchaRef = useRef<CaptchaInputRef>(null);
  const [form] = Form.useForm();

  return (
    <Card style={{ maxWidth: 400, margin: '48px auto' }} title="登录">
      <Form
        form={form}
        layout="vertical"
        onFinish={async (vals: { email: string; password: string }) => {
          // 获取验证码值
          const captchaValue = captchaRef.current?.getValue();
          if (!captchaValue) {
            message.error('请输入验证码');
            return;
          }

          setLoading(true);
          try {
            await login(vals.email, vals.password, captchaValue.captchaId, captchaValue.captchaCode);
            message.success('登录成功，欢迎回来！');
            const to = location.state?.from?.pathname ?? '/';
            navigate(to, { replace: true });
          } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
              const status = error.response?.status;
              const data = error.response?.data as unknown;
              let errorTitle = '登录失败';
              let errorMessage = '请检查邮箱和密码';

              if (data && typeof data === 'object' && 'message' in (data as Record<string, unknown>)) {
                const msgVal = (data as { message?: unknown }).message;
                if (typeof msgVal === 'string') errorMessage = msgVal;
              } else if (status === 401) {
                errorMessage = '邮箱或密码错误，请重新输入';
              } else if (status === 404) {
                errorTitle = '服务器连接失败';
                errorMessage = '无法连接到服务器，请稍后重试';
              } else if (error.code === 'NETWORK_ERROR') {
                errorTitle = '网络连接失败';
                errorMessage = '请检查网络设置后重试';
              }

              message.error(`${errorTitle}: ${errorMessage}`);

              // 如果是验证码错误，刷新验证码
              if (errorMessage.includes('验证码')) {
                captchaRef.current?.refresh();
                captchaRef.current?.clear();
              }

              // 控制台详细日志
              console.error('登录错误详情:', {
                status,
                data: error.response?.data,
                message: error.message,
                code: error.code,
                config: error.config,
              });
            } else {
              message.error('登录失败：发生未知错误');
              console.error('登录未知错误详情:', error);
            }
          } finally {
            setLoading(false);
          }
        }}
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[{ required: true }, { type: 'email' }]}
        >
          <Input placeholder="请填写您的邮箱" />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}>
          <Input.Password placeholder="请填写您的密码" />
        </Form.Item>
        <Form.Item
          label="验证码"
          rules={[
            { required: true, message: '请输入验证码' },
            {
              validator: () => {
                const captchaValue = captchaRef.current?.getValue();
                if (!captchaValue) {
                  return Promise.reject(new Error('请输入验证码'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <CaptchaInput
            ref={captchaRef}
            placeholder="请输入验证码"
            imageStyle={{
              width: 120,
              minHeight: 32,
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              overflow: 'hidden',
            }}
            onError={(error) => {
              message.error(`获取验证码失败: ${error.message}`);
            }}
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          登录
        </Button>
        <Button type="link" block onClick={() => navigate('/register')}>
          还没有账号？去注册
        </Button>
      </Form>
    </Card>
  );
}
