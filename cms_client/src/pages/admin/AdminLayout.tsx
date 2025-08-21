import { Layout, Menu } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';

const { Sider, Content } = Layout;

export default function AdminLayout(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const isDark = theme === 'dark';
  const selected = location.pathname.startsWith('/admin/users')
    ? 'users'
    : location.pathname.startsWith('/admin/refunds')
      ? 'refunds'
      : 'concerts';

  return (
    <Layout style={{
      minHeight: 'calc(100vh - 64px)',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: isDark ? '#141414' : '#f0f2f5',
    }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          backgroundColor: isDark ? '#1f1f1f' : '#001529',
        }}
      >
        <Menu
          theme={isDark ? 'dark' : 'dark'}
          mode="inline"
          selectedKeys={[selected]}
          onClick={(e) => navigate(`/admin/${e.key}`)}
          items={[
            { key: 'concerts', label: '演唱会管理' },
            { key: 'users', label: '用户管理' },
            { key: 'refunds', label: '退票审核' },
          ]}
          style={{
            backgroundColor: 'transparent',
          }}
        />
      </Sider>
      <Layout style={{ backgroundColor: 'transparent' }}>
        <Content style={{
          padding: 24,
          backgroundColor: isDark ? '#141414' : '#ffffff',
          borderRadius: '0 8px 8px 0',
          margin: '0',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
