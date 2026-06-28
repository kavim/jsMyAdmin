import { useMutation } from '@tanstack/react-query';
import { queryApi } from '@/lib/api';
import { QueryResult } from '@/types';

export function useExecuteQuery() {
  return useMutation({
    mutationFn: ({ database, sql }: { database: string; sql: string }) =>
      queryApi.execute(database, sql).then((r) => r.data as QueryResult),
  });
}
