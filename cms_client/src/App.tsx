import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { useThemeStore } from './stores/themeStore';
import { initializeAuth } from './stores/userStore';
import router from './router';

// 设置dayjs中文语言
dayjs.locale('zh-cn');

const App: React.FC = () => {
  const { getThemeConfig } = useThemeStore();

  // 初始化认证状态
  React.useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={getThemeConfig()}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
