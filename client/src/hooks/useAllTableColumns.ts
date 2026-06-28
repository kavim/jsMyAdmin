import { useQueries } from '@tanstack/react-query';
import { databaseApi } from '@/lib/api';
import { ColumnInfo, TableInfo } from '@/types';

export function useAllTableColumns(database: string | null, tables: TableInfo[]) {
  const queries = useQueries({
    queries: tables.map((table) => ({
      queryKey: ['columns', database, table.name],
      queryFn: () => databaseApi.getColumns(database!, table.name).then((r) => r.data),
      enabled: !!database,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const tableColumns: Record<string, ColumnInfo[]> = {};
  tables.forEach((table, i) => {
    if (queries[i]?.data) {
      tableColumns[table.name] = queries[i].data;
    }
  });

  const isLoading = queries.some((q) => q.isLoading);

  return { tableColumns, isLoading };
}
