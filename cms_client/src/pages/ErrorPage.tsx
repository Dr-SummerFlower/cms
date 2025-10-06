import { Button, Result } from 'antd';
import { useMemo, useState } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { createFeedback } from '../api/feedback';
import type { ErrorType } from '../types';

interface ErrorFeedback {
  timestamp: string;
  userAgent: string;
  url: string;
  errorType: ErrorType;
  message: string;
  stack?: string;
  routeStatus?: number;
  routeStatusText?: string;
  routeData?: any;
}

export default function ErrorPage(): JSX.Element {
  const err = useRouteError();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errorInfo = useMemo(() => {
    let title = '抱歉，页面出现问题';
    let subTitle = '请尝试刷新页面或返回首页继续浏览。若问题持续，请稍后再试。';
    let displayInfo: string | undefined;

    // 构建完整的错误反馈信息
    const feedback: ErrorFeedback = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: 'unknown',
      message: '页面出现问题但未提供详细信息',
    };

    if (isRouteErrorResponse(err)) {
      title = `错误 ${err.status}`;
      subTitle = err.statusText || subTitle;
      displayInfo = typeof err.data === 'string' ? err.data : undefined;

      feedback.errorType = 'route_error';
      feedback.routeStatus = err.status;
      feedback.routeStatusText = err.statusText;
      feedback.routeData = typeof err.data === 'string' ? err.data : JSON.stringify(err.data);
      feedback.message = `路由错误 ${err.status}: ${err.statusText}`;
    } else if (err && typeof err === 'object') {
      const e = err as { message?: unknown; stack?: unknown; name?: unknown };

      feedback.errorType = 'runtime_error';

      if (typeof e.message === 'string') {
        displayInfo = e.message;
        feedback.message = e.message;
      }

      if (typeof e.stack === 'string') {
        feedback.stack = e.stack;
      }

      if (typeof e.name === 'string') {
        // 只有当 e.name 是有效的 ErrorType 时才赋值
        const validErrorTypes: ErrorType[] = ['route_error', 'runtime_error', 'string_error', 'unknown'];
        if (validErrorTypes.includes(e.name as ErrorType)) {
          feedback.errorType = e.name as ErrorType;
        }
      }
    } else if (typeof err === 'string') {
      displayInfo = err;
      feedback.message = err;
      feedback.errorType = 'string_error';
    }

    return { title, subTitle, displayInfo, feedback };
  }, [err]);

  const isDev = import.meta.env.MODE === 'development';

  async function submitFeedback(): Promise<void> {
    try {
      setSubmitting(true);
      await createFeedback(errorInfo.feedback);
      setSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Result
      status="500"
      title={errorInfo.title}
      subTitle={errorInfo.subTitle}
      extra={[
        <Button key="refresh" type="primary" onClick={() => window.location.reload()}>
          刷新页面
        </Button>,
        <Button
          key="feedback"
          onClick={submitFeedback}
          loading={submitting}
          disabled={submitted}
        >
          {submitted ? '已提交反馈' : '问题反馈'}
        </Button>,
      ]}
    >
      {isDev && (errorInfo.displayInfo || errorInfo.feedback.stack) && (
        <div style={{ marginTop: 16, textAlign: 'left' }}>
          <details>
            <summary>错误详情（开发模式）</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {errorInfo.feedback.stack || errorInfo.displayInfo}
            </pre>
          </details>
        </div>
      )}
    </Result>
  );
}
