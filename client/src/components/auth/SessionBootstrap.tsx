import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import { useDatabaseStore } from '@/stores/databaseStore';

export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const resetDatabaseContext = useDatabaseStore((s) => s.reset);
  const [ready, setReady] = useState(() => !token);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    authApi
      .verify()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        logout();
        resetDatabaseContext();
        toast.error(getErrorMessage(error) || 'Session expired — please log in again');
        navigate('/login', { replace: true });
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout, resetDatabaseContext, navigate]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  return <>{children}</>;
}
