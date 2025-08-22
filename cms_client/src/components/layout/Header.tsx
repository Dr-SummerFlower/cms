import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { App as AntdApp, Avatar, Button, Dropdown, Layout, Menu, Space, Switch } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

const { Header } = Layout;

export default function AppHeader(): JSX.Element {
  const { isAuthed, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const isDark = theme === 'dark';
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    background: isDark ? '#1f1f1f' : '#667eea',
    borderBottom: isDark ? '1px solid #667eea' : '1px solid #303030',
  };

  const items = [
    { key: 'home', label: <Link to="/">首页</Link> },
    { key: 'tickets', label: <Link to="/me/tickets">我的票务</Link> },
  ];

  return (
    <Header style={headerStyle}>
      <div
        style={{
          color: isDark ? '#f0f0f0' : '#fff',
          fontWeight: 700,
          fontSize: '18px',
        }}
      >
        🎵 演唱会管理
      </div>
      <Menu
        theme={isDark ? 'dark' : 'dark'}
        mode="horizontal"
        selectedKeys={[
          location.pathname.startsWith('/me/tickets') ? 'tickets' : 'home',
        ]}
        items={items}
        style={{
          flex: 1,
          minWidth: 0,
          backgroundColor: 'transparent',
        }}
      />

      <Switch
        checked={isDark}
        onChange={toggleTheme}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        style={{ marginRight: 16 }}
      />

      {isAuthed ? (
        <Dropdown
          menu={{
            items: [
              {
                key: 'profile',
                label: (
                  <span onClick={() => navigate('/me/profile')}>个人资料</span>
                ),
              },
              ...(user?.role === 'ADMIN'
                ? [
                  {
                    key: 'admin',
                    label: (
                      <span onClick={() => navigate('/admin')}>管理后台</span>
                    ),
                  },
                ]
                : []),
              ...(user?.role === 'INSPECTOR'
                ? [
                  {
                    key: 'inspector',
                    label: (
                      <span onClick={() => navigate('/inspector')}>
                          验票入口
                        </span>
                    ),
                  },
                ]
                : []),
              {
                key: 'logout',
                label: '退出登录',
                onClick: () => {
                  logout();
                  message.success('已退出');
                  navigate('/');
                },
              },
            ],
          }}
        >
          <Avatar
            style={{ cursor: 'pointer' }}
            src={user?.avatar}
            alt={user?.username}
          >
            {user?.username?.at?.(0) ?? '我'}
          </Avatar>
        </Dropdown>
      ) : (
        <Space>
          <Button onClick={() => navigate('/login')}>登录</Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            注册
          </Button>
        </Space>
      )}
    </Header>
  );
}
