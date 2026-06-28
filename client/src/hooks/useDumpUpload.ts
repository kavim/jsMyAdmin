import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { UploadedFile } from '@/types';

export function useUploadDump() {
  return useMutation({
    mutationFn: ({ file, database }: { file: File; database?: string }) =>
      uploadApi.upload(file, database).then((r) => r.data as UploadedFile),
    onSuccess: () => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useImportDump() {
  return useMutation({
    mutationFn: ({ fileId, database }: { fileId: string; database: string }) =>
      uploadApi.import(fileId, database),
  });
}

export function useDeleteDump() {
  return useMutation({
    mutationFn: (fileId: string) => uploadApi.delete(fileId),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
