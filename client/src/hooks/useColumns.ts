import { useQuery } from '@tanstack/react-query';
import { databaseApi } from '@/lib/api';

export function useColumns(database: string | null, table: string | null) {
  return useQuery({
    queryKey: ['columns', database, table],
    queryFn: () => databaseApi.getColumns(database!, table!).then((r) => r.data),
    enabled: !!database && !!table,
  });
}
