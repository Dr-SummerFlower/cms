import { HomeOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { App as AntdApp, Avatar, Button, Dropdown, Layout, type MenuProps, Space, Switch } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { getImageUrl } from '../../utils/image';

const { Header } = Layout;

export default function AppHeader(): JSX.Element {
  const { isAuthed, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const isDark = theme === 'dark';
  const isMobile = window.innerWidth <= 768;
  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: isMobile ? '0 12px' : '0 24px',
    background: isDark
      ? 'linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderBottom: isDark ? '1px solid #434343' : '1px solid #5a67d8',
    height: '72px',
    boxShadow: isDark
      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
      : '0 2px 8px rgba(102, 126, 234, 0.2)',
    position: 'relative' as const,
    zIndex: 1000,
  };

  const getUserMenuItems = (): MenuProps['items'] => [
    ...(user?.role !== 'INSPECTOR'
      ? [
        {
          key: 'tickets',
          label: '我的票务',
        },
      ]
      : []),
    {
      key: 'profile',
      label: '个人资料',
    },
    ...(user?.role === 'ADMIN'
      ? [
        {
          key: 'admin',
          label: '管理后台',
        },
      ]
      : []),
    ...(user?.role === 'INSPECTOR'
      ? [
        {
          key: 'inspector',
          label: '验票入口',
        },
      ]
      : []),
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const handleUserMenuClick = (info: { key: string }) => {
    switch (info.key) {
      case 'tickets':
        navigate('/me/tickets');
        break;
      case 'profile':
        navigate('/me/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'inspector':
        navigate('/inspector');
        break;
      case 'logout':
        logout();
        message.success('已退出');
        navigate('/');
        break;
      default:
        break;
    }
  };

  const getRouteTitle = (path: string) => {
    if (path === '/') return '主页';
    if (path.startsWith('/login')) return '登录';
    if (path.startsWith('/register')) return '注册';
    if (path.startsWith('/me/tickets')) return '我的票务';
    if (path.startsWith('/me/profile')) return '个人资料';
    if (path.startsWith('/admin')) return '管理后台';
    if (path.startsWith('/inspector')) return '验票入口';
    return '演唱会管理';
  };

  return (
    <Header style={headerStyle}>
      {/* Logo 区域 */}
      <Link
        to="/"
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          flexShrink: 0,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <div
          style={{
            color: isDark ? '#f0f0f0' : '#fff',
            fontWeight: 800,
            fontSize: isMobile ? '20px' : '24px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: isDark
              ? '0 2px 4px rgba(0, 0, 0, 0.5)'
              : '0 2px 4px rgba(0, 0, 0, 0.2)',
            letterSpacing: '0.5px',
          }}
        >
          🎵 演唱会管理
        </div>
      </Link>

      {/* 非首页时显示返回主页按钮，提供清晰引导 */}
      {location.pathname !== '/' && (
        <div style={{ marginLeft: '8px' }}>
          {isMobile ? (
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{ color: isDark ? '#f0f0f0' : '#fff' }}
            />
          ) : (
            <Button
              type="link"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{ color: isDark ? '#f0f0f0' : '#fff', fontWeight: 600 }}
            >
              返回主页
            </Button>
          )}
        </div>
      )}

      {/* 中间区域：在PC端显示当前页面标题以减少空旷感；移动端隐藏以节省空间 */}
      <div style={{ flex: 1, minWidth: '16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          color: isDark ? '#d9d9d9' : '#fff',
          fontSize: '16px',
          fontWeight: 600,
          opacity: 0.85,
          textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4)' : '0 1px 2px rgba(0,0,0,0.2)',
          display: isMobile ? 'none' : 'block',
        }}>
          {getRouteTitle(location.pathname)}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '8px',
        flexShrink: 0,
      }}>
        <Switch
          checked={isDark}
          onChange={toggleTheme}
          checkedChildren={<MoonOutlined style={{ fontSize: '14px' }} />}
          unCheckedChildren={<SunOutlined style={{ fontSize: '14px' }} />}
          size={isMobile ? 'small' : 'default'}
          style={{
            backgroundColor: isDark ? '#434343' : '#f0f0f0',
            borderColor: isDark ? '#595959' : '#d9d9d9',
          }}
        />

        {isAuthed ? (
          <Dropdown
            menu={{
              items: getUserMenuItems(),
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            overlayStyle={{
              minWidth: '160px',
            }}
          >
            <Avatar
              style={{
                cursor: 'pointer',
                border: `2px solid ${isDark ? '#434343' : 'rgba(255, 255, 255, 0.3)'}`,
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
              }}
              src={getImageUrl(user?.avatar)}
              alt={user?.username}
              size={isMobile ? 'default' : 'large'}
            >
              {user?.username?.at?.(0) ?? '我'}
            </Avatar>
          </Dropdown>
        ) : (
          <Space size={isMobile ? 'small' : 'middle'}>
            <Button
              size={isMobile ? 'middle' : 'large'}
              onClick={() => navigate('/login')}
              style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${isDark ? '#434343' : 'rgba(255, 255, 255, 0.3)'}`,
                backgroundColor: 'transparent',
                color: isDark ? '#f0f0f0' : '#fff',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#434343' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              登录
            </Button>
            {/* 已移除注册按钮，注册入口合并至登录页 */}
          </Space>
        )}
      </div>
    </Header>
  );
}
