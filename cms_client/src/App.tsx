import {App as AntdApp, ConfigProvider, Layout, theme} from 'antd';
import {Outlet} from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import AppFooter from './components/layout/Footer';
import AppHeader from './components/layout/Header';
import {useThemeStore} from './stores/themeStore';

const {Content} = Layout;

export default function App() {
  const {theme: currentTheme} = useThemeStore();
  const isDark = currentTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
          fontSize: 14,
          borderRadius: 6,
        },
        components: {
          Message: {
            contentBg: isDark ? "#1f1f1f" : "#ffffff",
            contentPadding: "12px 16px",
            fontSize: 14,
            borderRadius: 8,
            boxShadow: isDark
              ? "0 6px 16px 0 rgba(0, 0, 0, 0.4), 0 3px 6px -4px rgba(0, 0, 0, 0.6), 0 9px 28px 8px rgba(0, 0, 0, 0.2)"
              : "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)",
          },
        },
      }}
    >
      <AntdApp
        message={{
          duration: 4,
          maxCount: 3,
          top: 24,
        }}
      >
        <ErrorBoundary>
          <Layout
            style={{
              minHeight: "100vh",
              backgroundColor: isDark ? "#141414" : "#f0f2f5",
            }}
          >
            <AppHeader/>
            <Content
              style={{
                padding: 24,
                backgroundColor: isDark ? "#141414" : "#f0f2f5",
              }}
            >
              <Outlet/>
            </Content>
            <AppFooter/>
          </Layout>
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}
