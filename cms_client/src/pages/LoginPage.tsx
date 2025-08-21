import { App as AntdApp, Button, Card, Form, Input } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };
  const { message } = AntdApp.useApp();

  return (
    <Card style={{ maxWidth: 400, margin: '48px auto' }} title="登录">
      <Form
        layout="vertical"
        onFinish={async (vals: { email: string; password: string }) => {
          setLoading(true);
          try {
            await login(vals.email, vals.password);
            message.success('登录成功');
            const to = location.state?.from?.pathname ?? '/';
            navigate(to, { replace: true });
          } catch {
            message.error('登录失败');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Form.Item name="email" label="邮箱" rules={[{ required: true }, { type: 'email' }]}>
          <Input placeholder="请填写您的邮箱" />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true }]}>
          <Input.Password placeholder="请填写您的密码" />
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
