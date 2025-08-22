import { ConfigProvider, Layout, theme } from 'antd';
import { Outlet } from 'react-router-dom';
import AppFooter from './components/layout/Footer';
import AppHeader from './components/layout/Header';
import { useThemeStore } from './stores/themeStore';

const { Content } = Layout;

export default function App() {
  const { theme: currentTheme } = useThemeStore();
  const isDark = currentTheme === 'dark';

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Layout
        style={{
          minHeight: '100vh',
          backgroundColor: isDark ? '#141414' : '#f0f2f5',
        }}
      >
        <AppHeader />
        <Content
          style={{
            padding: 24,
            backgroundColor: isDark ? '#141414' : '#f0f2f5',
          }}
        >
          <Outlet />
        </Content>
        <AppFooter />
      </Layout>
    </ConfigProvider>
  );
}
