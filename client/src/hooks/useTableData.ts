import { useQuery } from '@tanstack/react-query';
import { tableApi } from '@/lib/api';
import { QueryResult } from '@/types';

export interface TableDataParams {
  database: string;
  table: string;
  page?: number;
  limit?: number;
  where?: string;
  orderBy?: string;
}

export interface TableDataResponse extends QueryResult {
  page: number;
  limit: number;
  total: number;
}

export function useTableData(params: TableDataParams | null) {
  return useQuery({
    queryKey: ['table-data', params],
    queryFn: async () => {
      if (!params) throw new Error('No params');
      const res = await tableApi.getData(
        params.database,
        params.table,
        params.page ?? 1,
        params.limit ?? 100,
        params.where,
        params.orderBy
      );
      return res.data as TableDataResponse;
    },
    enabled: !!params?.database && !!params?.table,
  });
}
