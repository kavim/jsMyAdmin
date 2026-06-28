import { toast } from 'sonner';
import { useNotificationStore } from '@/stores/notificationStore';

export function notifyQuerySuccess(message: string) {
  toast.success(message);
  useNotificationStore.getState().add({
    level: 'success',
    title: 'Query executed',
    message,
  });
}

export function notifyQueryError(message: string) {
  toast.error(message);
  useNotificationStore.getState().add({
    level: 'error',
    title: 'Query failed',
    message,
  });
}

export function notifySync(message: string) {
  useNotificationStore.getState().add({
    level: 'info',
    title: 'Synchronization',
    message,
  });
}

export function notifyUpload(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  useNotificationStore.getState().add({
    level,
    title: 'Upload',
    message,
  });
}

export function bridgeToast(type: 'success' | 'error' | 'info', title: string, message?: string) {
  const fn = type === 'success' ? toast.success : type === 'error' ? toast.error : toast.info;
  fn(message ?? title);
  useNotificationStore.getState().add({ level: type === 'info' ? 'info' : type, title, message });
}
