import { Plus, X, Code2, Table2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWorkspaceStore, WorkspaceTab, isSqlTabDirty } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';

function tabIcon(tab: WorkspaceTab) {
  if (tab.kind === 'sql') return <Code2 className="h-3 w-3 shrink-0" />;
  if (tab.kind === 'table-data') return <Table2 className="h-3 w-3 shrink-0" />;
  return null;
}

function tabTitle(tab: WorkspaceTab): string {
  if (tab.kind === 'welcome') return 'Welcome';
  if (tab.kind === 'sql') {
    const dirty = isSqlTabDirty(tab) ? ' *' : '';
    return tab.title + dirty;
  }
  return tab.title;
}

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, createSqlTab, reorderTab } = useWorkspaceStore();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(fromIndex) && fromIndex !== toIndex) {
      reorderTab(fromIndex, toIndex);
    }
  };

  if (tabs.length === 0) {
    return (
      <div className="flex items-center border-b border-border bg-tab-inactive">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => createSqlTab()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New SQL console (Ctrl+Shift+N)</TooltipContent>
        </Tooltip>
        <span className="px-2 text-xs text-muted-foreground">New SQL console</span>
      </div>
    );
  }

  return (
    <div className="flex items-center border-b border-border bg-tab-inactive overflow-x-auto">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, index)}
          className={cn(
            'group flex cursor-pointer items-center gap-1 border-r border-border px-3 py-1.5 text-xs',
            tab.id === activeTabId
              ? 'bg-tab-active text-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
          onClick={() => setActiveTab(tab.id)}
        >
          <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40" />
          {tabIcon(tab)}
          <span className="max-w-[140px] truncate">{tabTitle(tab)}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => createSqlTab()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New console (Ctrl+Shift+N)</TooltipContent>
      </Tooltip>
    </div>
  );
}
