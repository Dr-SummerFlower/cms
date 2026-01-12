import { Spin } from "antd";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { Role } from "../types";

interface ProtectedProps {
  children: JSX.Element;
  roles?: ReadonlyArray<Role>;
}

export default function Protected({
  children,
  roles,
}: ProtectedProps): JSX.Element {
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const ready = useAuthStore((s) => s.ready);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    if (!ready) {
      void bootstrap();
    }
  }, [ready, bootstrap]);

  if (!ready) {
    return (
      <div
        style={{
          height: "50vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
