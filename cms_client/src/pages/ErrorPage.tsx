import { App as AntdApp, Button, Card, Space, Typography } from 'antd';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

export default function ErrorPage(): JSX.Element {
  const err = useRouteError();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const { title, desc } = (() => {
    if (isRouteErrorResponse(err)) {
      return {
        title: `错误 ${err.status}`,
        desc: err.statusText || '路由错误',
      };
    }
    if (err instanceof Error) {
      return { title: '应用出错了', desc: err.message };
    }
    return { title: '应用出错了', desc: '发生未知错误' };
  })();

  return (
    <Card style={{ maxWidth: 520, margin: '64px auto' }} title={title}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Paragraph
          type="secondary"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {desc}
        </Typography.Paragraph>
        <Space>
          <Button type="primary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
          <Button
            onClick={() => {
              window.location.href = '/';
            }}
          >
            回到首页
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(String(desc)).then(
                (r) => r,
                (e) => e,
              );
              message.success('错误信息已复制');
            }}
          >
            复制错误信息
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
