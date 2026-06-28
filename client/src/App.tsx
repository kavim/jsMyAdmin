import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from './stores/authStore';
import { useDatabaseStore } from './stores/databaseStore';
import { setOnUnauthorized } from './lib/api';
import SessionBootstrap from './components/auth/SessionBootstrap';
import IdeShell from './components/layout/IdeShell';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <SessionBootstrap>{children}</SessionBootstrap>;
}

function AuthHandler() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const resetDatabaseContext = useDatabaseStore((s) => s.reset);

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      resetDatabaseContext();
      toast.error('Session expired — please log in again');
      navigate('/login', { replace: true });
    });
  }, [navigate, logout, resetDatabaseContext]);

  return null;
}

function App() {
  return (
    <>
      <AuthHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <IdeShell />
            </ProtectedRoute>
          }
        />
        <Route path="/query" element={<Navigate to="/?tab=sql" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/query-builder" element={<Navigate to="/?tool=query-builder" replace />} />
        <Route path="/dump" element={<Navigate to="/?tool=dump" replace />} />
      </Routes>
    </>
  );
}

export default App;
