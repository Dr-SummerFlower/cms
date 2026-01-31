import {App as AntdApp, ConfigProvider, theme} from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {RouterProvider} from 'react-router-dom';
import router from './router';
import './index.css';

dayjs.locale("zh-cn");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{algorithm: theme.defaultAlgorithm}}>
      <AntdApp>
        <RouterProvider router={router}/>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
);
