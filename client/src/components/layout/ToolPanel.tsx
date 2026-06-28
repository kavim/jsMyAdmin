import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NotificationPanel from '@/components/notifications/NotificationPanel';
import QueryBuilderPage from '@/pages/QueryBuilderPage';
import DumpPage from '@/pages/DumpPage';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'notifications' as const, label: 'Notifications' },
  { id: 'query-builder' as const, label: 'Query Builder' },
  { id: 'dump' as const, label: 'Dump' },
];

export default function ToolPanel() {
  const { toolPanelVisible, toggleToolPanel, toolPanelView, setToolPanelView } = useWorkspaceStore();

  if (!toolPanelVisible) {
    return (
      <div className="flex h-full w-8 flex-col items-center border-l border-border bg-sidebar py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleToolPanel}>
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Show tool panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cn(
              'flex-1 border-r border-border px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide last:border-r-0',
              toolPanelView === tab.id
                ? 'bg-tab-active text-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
            onClick={() => setToolPanelView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleToolPanel}>
          <PanelRightClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {toolPanelView === 'notifications' && <NotificationPanel />}
        {toolPanelView === 'query-builder' && (
          <div className="h-full overflow-auto p-3">
            <QueryBuilderPage />
          </div>
        )}
        {toolPanelView === 'dump' && (
          <div className="h-full overflow-auto p-3">
            <DumpPage />
          </div>
        )}
      </div>
    </div>
  );
}
