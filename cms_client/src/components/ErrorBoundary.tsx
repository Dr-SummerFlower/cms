import React from 'react';
import ErrorPage from '../pages/ErrorPage';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    if (import.meta.env.MODE === 'development') {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorPage />;
    }

    return this.props.children;
  }
}
