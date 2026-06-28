import { ChevronRight } from 'lucide-react';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useAuthStore } from '@/stores/authStore';

export default function StatusBar() {
  const { currentDatabase, selectedTable } = useDatabaseStore();
  const connection = useAuthStore((s) => s.connection);
  const host = connection ? `@${connection.host}` : '@localhost';

  const crumbs = ['Database', host];
  if (currentDatabase) crumbs.push(currentDatabase);
  if (selectedTable) {
    crumbs.push('tables', selectedTable);
  } else if (currentDatabase) {
    crumbs.push('No table selected');
  } else {
    crumbs.push('No schemas');
  }

  return (
    <footer className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-status-bar px-3 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1 truncate">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="h-2.5 w-2.5 opacity-50" />}
            <span className={i === crumbs.length - 1 ? 'text-foreground' : undefined}>{c}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-green-500">●</span>
        <span>Connected</span>
      </div>
    </footer>
  );
}
