import { useQuery } from '@tanstack/react-query';
import { databaseApi } from '@/lib/api';

export function useTables(database: string | null) {
  return useQuery({
    queryKey: ['tables', database],
    queryFn: () => databaseApi.listTables(database!).then((r) => r.data),
    enabled: !!database,
  });
}
