import {App as AntdApp, ConfigProvider, Layout} from "antd";
import {Outlet} from "react-router-dom";
import BackToTop from "./components/common/BackToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import AppFooter from "./components/layout/Footer";
import AppHeader from "./components/layout/Header";
import {useThemeStore} from "./stores/themeStore";
import {THEMES} from "./styles/themes";

const {Content} = Layout;

export default function App() {
  const {theme} = useThemeStore();
  const themeConfig = THEMES[theme];

  return (
    <ConfigProvider theme={themeConfig.antdConfig}>
      <AntdApp
        message={{
          duration: 4,
          maxCount: 3,
          top: 24,
        }}
      >
        <ErrorBoundary>
          <Layout style={{minHeight: "100vh"}}>
            <AppHeader/>
            <Content style={{padding: 24}}>
              <Outlet/>
            </Content>
            <AppFooter/>
            <BackToTop/>
          </Layout>
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}
