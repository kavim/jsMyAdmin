import { useQuery } from '@tanstack/react-query';
import { queryApi } from '@/lib/api';

export function useQueryHistory() {
  return useQuery({
    queryKey: ['query-history'],
    queryFn: () => queryApi.history().then((r) => r.data),
  });
}
