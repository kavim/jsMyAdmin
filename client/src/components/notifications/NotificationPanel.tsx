import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotificationStore,
  NotificationLevel,
  AppNotification,
} from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

const iconMap: Record<NotificationLevel, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const colorMap: Record<NotificationLevel, string> = {
  info: 'text-primary',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-destructive',
};

function NotificationCard({ item }: { item: AppNotification }) {
  const remove = useNotificationStore((s) => s.remove);
  const Icon = iconMap[item.level];

  return (
    <div className="border-b border-border px-3 py-2 text-xs">
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', colorMap[item.level])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{item.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={() => remove(item.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {item.message && (
            <p className="mt-0.5 text-muted-foreground break-words">{item.message}</p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {new Date(item.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPanel() {
  const items = useNotificationStore((s) => s.items);
  const clear = useNotificationStore((s) => s.clear);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-end border-b border-border px-3 py-2">
        {items.length > 0 && (
          <button
            type="button"
            className="text-[10px] text-primary hover:underline"
            onClick={clear}
          >
            Clear all
          </button>
        )}
      </div>
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</p>
        ) : (
          items.map((item) => <NotificationCard key={item.id} item={item} />)
        )}
      </ScrollArea>
    </div>
  );
}
