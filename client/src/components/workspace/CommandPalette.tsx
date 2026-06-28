import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useThemeStore } from '@/stores/themeStore';
import { THEME_REGISTRY } from '@/themes';

interface Command {
  id: string;
  label: string;
  run: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { createSqlTab, toggleExplorer, toggleToolPanel, openToolPanel } = useWorkspaceStore();
  const { setThemeId } = useThemeStore();

  const allCommands: Command[] = useMemo(
    () => [
      { id: 'new-sql', label: 'New SQL console', run: () => createSqlTab() },
      { id: 'toggle-explorer', label: 'Toggle Database Explorer', run: () => toggleExplorer() },
      { id: 'toggle-notifications', label: 'Toggle Notifications', run: () => toggleToolPanel() },
      { id: 'query-builder', label: 'Open Query Builder', run: () => openToolPanel('query-builder') },
      { id: 'dump', label: 'Open Dump Import', run: () => openToolPanel('dump') },
      ...THEME_REGISTRY.map((t) => ({
        id: `theme-${t.id}`,
        label: `Color theme: ${t.label}`,
        run: () => setThemeId(t.id),
      })),
    ],
    [createSqlTab, toggleExplorer, toggleToolPanel, openToolPanel, setThemeId]
  );

  const filtered = allCommands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setQuery('');
    };
    document.addEventListener('elendra:open-command-palette', handler);
    return () => document.removeEventListener('elendra:open-command-palette', handler);
  }, []);

  const run = (cmd: Command) => {
    cmd.run();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm">Command Palette</DialogTitle>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="border-0 border-b rounded-none focus-visible:ring-0"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) {
              e.preventDefault();
              run(filtered[0]);
            }
          }}
        />
        <ul className="max-h-64 overflow-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-2 text-sm text-muted-foreground">No commands found</li>
          )}
          {filtered.map((cmd) => (
            <li key={cmd.id}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                onClick={() => run(cmd)}
              >
                {cmd.label}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
