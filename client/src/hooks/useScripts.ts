import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptsApi } from '@/lib/api';

export function useScripts() {
  return useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptsApi.list().then((r) => r.data),
  });
}

export function useSaveScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, content }: { path: string; content: string }) =>
      scriptsApi.save(path, content).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
}

export function useCreateScriptFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => scriptsApi.createFolder(path).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => scriptsApi.delete(path).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });
}

export async function readScriptFile(path: string) {
  const res = await scriptsApi.read(path);
  return res.data;
}
