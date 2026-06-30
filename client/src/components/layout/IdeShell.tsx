import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SplitPane } from '@/components/ui/split-pane';
import AppHeader from './AppHeader';
import StatusBar from './StatusBar';
import ToolPanel from './ToolPanel';
import DatabaseExplorer from '@/components/explorer/DatabaseExplorer';
import ScriptsTree from '@/components/explorer/ScriptsTree';
import TabBar from '@/components/workspace/TabBar';
import WorkspaceArea from '@/components/workspace/WorkspaceArea';
import CommandPalette from '@/components/workspace/CommandPalette';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useIdeShortcuts } from '@/hooks/useIdeShortcuts';

function ExplorerPanel() {
  const { explorerVisible, toggleExplorer, createSqlTab, requestSaveAs } = useWorkspaceStore();

  if (!explorerVisible) {
    return (
      <div className="flex h-full w-8 flex-col items-center border-r border-border bg-sidebar py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleExplorer}>
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Show explorer</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex justify-end border-b border-border px-1 py-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleExplorer}>
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
        <ScriptsTree
          onNewFile={(folder) => {
            createSqlTab();
            requestSaveAs(folder);
          }}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          <DatabaseExplorer />
        </div>
      </div>
    </div>
  );
}

function IdeWorkspace() {
  const { openSqlWithQuery } = useWorkspaceStore();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.name.endsWith('.sql')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const sql = String(reader.result ?? '');
      openSqlWithQuery(sql, file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <TabBar />
      <div className="min-h-0 flex-1 overflow-hidden">
        <WorkspaceArea />
      </div>
    </div>
  );
}

export default function IdeShell() {
  const [searchParams] = useSearchParams();
  const { createSqlTab, tabs, toolPanelVisible, openToolPanel } = useWorkspaceStore();

  useIdeShortcuts();

  useEffect(() => {
    const openSql = searchParams.get('tab') === 'sql' || searchParams.get('open') === 'sql';
    if (openSql && tabs.length === 0) {
      createSqlTab();
    }
    const table = searchParams.get('table');
    const db = searchParams.get('database');
    if (table && db) {
      useWorkspaceStore.getState().openSqlWithQuery(`SELECT * FROM \`${table}\` LIMIT 100;`, table);
    }
    const tool = searchParams.get('tool');
    if (tool === 'query-builder' || tool === 'dump' || tool === 'notifications') {
      openToolPanel(tool);
    }
  }, [searchParams, createSqlTab, tabs.length, openToolPanel]);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <CommandPalette />
      <AppHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SplitPane
          direction="horizontal"
          defaultRatio={0.2}
          minFirst={0.08}
          minSecond={0.4}
          first={<ExplorerPanel />}
          second={
            <SplitPane
              direction="horizontal"
              defaultRatio={toolPanelVisible ? 0.82 : 1}
              minFirst={0.5}
              minSecond={0.12}
              first={<IdeWorkspace />}
              second={<ToolPanel />}
            />
          }
        />
      </div>
      <StatusBar />
    </div>
  );
}
