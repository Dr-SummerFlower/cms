import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface ProtectedProps {
  children: JSX.Element;
  roles?: ReadonlyArray<Role>;
}

export default function Protected({ children, roles }: ProtectedProps): JSX.Element {
  const location = useLocation();
  const { user, isAuthed, bootstrap } = useAuthStore((s) => ({
    user: s.user,
    isAuthed: s.isAuthed,
    bootstrap: s.bootstrap,
  }));

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await bootstrap();
      } finally {
        setChecking(false);
      }
    })();
  }, [bootstrap]);

  if (checking) {
    return (
      <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
