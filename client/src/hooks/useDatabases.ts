import { useQuery } from '@tanstack/react-query';
import { databaseApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export function useDatabases() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['databases'],
    queryFn: () => databaseApi.list().then((r) => r.data),
    enabled: isAuthenticated,
  });
}
