import {Button, Result} from 'antd';
import {useMemo} from 'react';
import {isRouteErrorResponse, useRouteError} from 'react-router-dom';

interface ErrorPageProps {
  error?: unknown;
}

export default function ErrorPage({error: propError}: ErrorPageProps = {}): JSX.Element {
  const routeError = useRouteError();
  // 优先使用 prop 传递的错误(来自 ErrorBoundary),其次使用路由错误
  const err = propError ?? routeError;

  const errorInfo = useMemo(() => {
    let title = "抱歉，页面出现问题";
    let subTitle = "请尝试刷新页面或返回首页继续浏览。若问题持续，请稍后再试。";
    let displayInfo: string | undefined;
    let stack: string | undefined;

    if (isRouteErrorResponse(err)) {
      title = `错误 ${err.status}`;
      subTitle = err.statusText || subTitle;
      displayInfo =
        typeof err.data === "string" ? err.data : JSON.stringify(err.data, null, 2);
    } else if (err && typeof err === "object") {
      const e = err as { message?: unknown; stack?: unknown };

      if (typeof e.message === "string") {
        displayInfo = e.message;
      }

      if (typeof e.stack === "string") {
        stack = e.stack;
      }
    } else if (typeof err === "string") {
      displayInfo = err;
    }

    return {title, subTitle, displayInfo, stack};
  }, [err]);

  const isDev = import.meta.env.MODE === "development";

  return (
    <Result
      status="500"
      title={errorInfo.title}
      subTitle={errorInfo.subTitle}
      extra={[
        <Button
          key="refresh"
          type="primary"
          onClick={() => window.location.reload()}
        >
          刷新页面
        </Button>,
      ]}
    >
      {isDev && (errorInfo.displayInfo || errorInfo.stack) && (
        <div style={{marginTop: 16, textAlign: "left"}}>
          <details>
            <summary>错误详情（开发模式）</summary>
            <pre style={{whiteSpace: "pre-wrap", fontSize: "12px"}}>
              {errorInfo.stack || errorInfo.displayInfo}
            </pre>
          </details>
        </div>
      )}
    </Result>
  );
}
