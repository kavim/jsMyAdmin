import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const shortcuts = [
  { label: 'New SQL console', keys: 'Ctrl+Shift+N', action: 'new-sql' },
  { label: 'Recent tabs', keys: 'Ctrl+E', action: 'recent' },
  { label: 'Manage connection', keys: 'Ctrl+Alt+S', action: 'connection' },
  { label: 'Toggle explorer', keys: 'Ctrl+B', action: 'explorer' },
  { label: 'Toggle notifications', keys: 'Ctrl+Shift+B', action: 'notifications' },
  { label: 'Command palette', keys: 'Ctrl+Shift+P', action: 'palette' },
] as const;

export default function WelcomeTab() {
  const navigate = useNavigate();
  const { createSqlTab, tabs, setActiveTab } = useWorkspaceStore();

  const handleAction = (action: string) => {
    switch (action) {
      case 'new-sql':
        createSqlTab();
        break;
      case 'recent':
        if (tabs.length > 0) setActiveTab(tabs[tabs.length - 1].id);
        break;
      case 'connection':
        navigate('/login');
        break;
      case 'explorer':
        useWorkspaceStore.getState().toggleExplorer();
        break;
      case 'notifications':
        useWorkspaceStore.getState().toggleToolPanel();
        break;
      case 'palette':
        document.dispatchEvent(new CustomEvent('elendra:open-command-palette'));
        break;
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-editor text-muted-foreground">
      <div className="max-w-md space-y-4 px-6">
        <h2 className="text-center text-lg font-medium text-foreground">Elendra</h2>
        <p className="text-center text-sm">Database IDE — select a table or open a console to begin.</p>
        <ul className="space-y-2 text-sm">
          {shortcuts.map((item) => (
            <li key={item.action} className="flex items-center justify-between gap-8">
              <button
                type="button"
                className="text-left text-foreground/80 hover:text-primary hover:underline"
                onClick={() => handleAction(item.action)}
              >
                {item.label}
              </button>
              <kbd className="shrink-0 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px]">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="pt-4 text-center text-xs">Drop .sql files on the workspace to open</p>
      </div>
    </div>
  );
}
