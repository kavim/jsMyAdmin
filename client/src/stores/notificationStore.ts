import { create } from 'zustand';

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  level: NotificationLevel;
  title: string;
  message?: string;
  timestamp: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationState {
  items: AppNotification[];
  add: (item: Omit<AppNotification, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  clear: () => void;
  remove: (id: string) => void;
}

const MAX_ITEMS = 50;

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],

  add: (item) =>
    set((state) => ({
      items: [
        {
          ...item,
          id: crypto.randomUUID(),
          timestamp: item.timestamp ?? Date.now(),
        },
        ...state.items,
      ].slice(0, MAX_ITEMS),
    })),

  clear: () => set({ items: [] }),

  remove: (id) =>
    set((state) => ({
      items: state.items.filter((n) => n.id !== id),
    })),
}));
