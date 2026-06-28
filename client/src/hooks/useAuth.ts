import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { useDatabaseStore } from '@/stores/databaseStore';
import { DbCredentials } from '@/types';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutStore = useAuthStore((s) => s.logout);
  const setCurrentDatabase = useDatabaseStore((s) => s.setCurrentDatabase);
  const resetDatabaseContext = useDatabaseStore((s) => s.reset);

  const login = useMutation({
    mutationFn: (credentials: DbCredentials) =>
      authApi.login(credentials).then((r) => r.data),
    onSuccess: (data) => {
      setAuth(data.token, data.connection);
      resetDatabaseContext();
      setCurrentDatabase(data.connection.database ?? null);
      queryClient.removeQueries({ queryKey: ['databases'] });
      queryClient.removeQueries({ queryKey: ['tables'] });
      toast.success('Connected successfully');
      navigate('/');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      disconnectSocket();
      logoutStore();
      resetDatabaseContext();
      queryClient.clear();
      navigate('/login');
    },
  });

  return { login, logout };
}
