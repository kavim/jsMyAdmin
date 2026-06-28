import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Database,
  Table2,
  Columns3,
  RefreshCw,
  Search,
  Key,
  Link2,
  ListTree,
  Minus,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useTables } from '@/hooks/useTables';
import { useColumns } from '@/hooks/useColumns';
import { useDatabases } from '@/hooks/useDatabases';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { ColumnInfo } from '@/types';
import { cn } from '@/lib/utils';
import { notifySync } from '@/lib/notifications';

export default function DatabaseExplorer() {
  const connection = useAuthStore((s) => s.connection);
  const { currentDatabase, setSelectedTable, selectedTable } = useDatabaseStore();
  const { data: databases = [] } = useDatabases();
  const { data: tables = [], isLoading, refetch, isFetching } = useTables(currentDatabase);
  const {
    columnsByTable,
    setColumnsByTable,
    insertIntoActiveEditor,
    openTableTab,
    openSqlWithQuery,
  } = useWorkspaceStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['connection', 'database', 'tables']));
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const { data: columns = [], isLoading: columnsLoading } = useColumns(
    currentDatabase,
    activeTable
  );

  const hostLabel = connection ? `@${connection.host}` : '@localhost';

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const collapseAll = () => setExpanded(new Set(['connection']));

  const handleRefresh = async () => {
    await refetch();
    notifySync('Schema refreshed');
  };

  useEffect(() => {
    if (columns.length > 0 && activeTable) {
      setColumnsByTable((prev) => ({ ...prev, [activeTable]: columns }));
    }
  }, [columns, activeTable, setColumnsByTable]);

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  const selectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setActiveTable(tableName);
    setExpanded((prev) => new Set(prev).add(`table:${tableName}`).add(`cols:${tableName}`));
  };

  const isOpen = (key: string) => expanded.has(key);

  const colsFor = (tableName: string) =>
    activeTable === tableName ? columnsByTable[tableName] ?? columns : columnsByTable[tableName] ?? [];

  return (
    <div className="flex h-full flex-col bg-sidebar text-foreground">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Database Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={collapseAll}>
                <Minus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleRefresh}
                disabled={isLoading || isFetching}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh schema</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="border-b border-border px-2 py-1.5">
        <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tables..."
            className="h-6 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1 text-sm">
          {/* Connection */}
          <div
            className="flex cursor-pointer items-center gap-1 px-2 py-0.5 hover:bg-tree-hover"
            onClick={() => toggle('connection')}
          >
            {isOpen('connection') ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>{hostLabel}</span>
            <span className="ml-1 text-[10px] text-green-500">●</span>
          </div>

          {isOpen('connection') && currentDatabase && (
            <>
              {/* Database */}
              <div
                className="flex cursor-pointer items-center gap-1 py-0.5 pl-5 pr-2 hover:bg-tree-hover"
                onClick={() => toggle('database')}
              >
                {isOpen('database') ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <FolderOpen className="h-3.5 w-3.5 text-primary" />
                <span>{currentDatabase}</span>
              </div>

              {isOpen('database') && (
                <>
                  {/* tables folder */}
                  <div
                    className="flex cursor-pointer items-center gap-1 py-0.5 pl-9 pr-2 hover:bg-tree-hover"
                    onClick={() => toggle('tables')}
                  >
                    {isOpen('tables') ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <Table2 className="h-3.5 w-3.5 text-primary" />
                    <span>tables</span>
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      {tables.length}
                    </Badge>
                  </div>

                  {isOpen('tables') && (
                    <>
                      {isLoading && (
                        <div className="space-y-1 px-12 py-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-5 w-full" />
                          ))}
                        </div>
                      )}
                      {filtered.map((table) => {
                        const tableKey = `table:${table.name}`;
                        const colsKey = `cols:${table.name}`;
                        const tableCols = colsFor(table.name);

                        return (
                          <div key={table.name}>
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <div
                                  className={cn(
                                    'flex cursor-pointer items-center gap-1 py-0.5 pl-14 pr-2 hover:bg-tree-hover',
                                    selectedTable === table.name && 'bg-tree-selected'
                                  )}
                                  onClick={() => {
                                    toggle(tableKey);
                                    selectTable(table.name);
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (currentDatabase) openTableTab(table.name, currentDatabase);
                                  }}
                                >
                                  {isOpen(tableKey) ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <Table2 className="h-3.5 w-3.5 text-primary" />
                                  <span className="truncate">{table.name}</span>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() =>
                                    currentDatabase && openTableTab(table.name, currentDatabase)
                                  }
                                >
                                  Open data
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() =>
                                    openSqlWithQuery(
                                      `SELECT * FROM \`${table.name}\` LIMIT 100;`,
                                      table.name
                                    )
                                  }
                                >
                                  SELECT *
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  onClick={() => navigator.clipboard.writeText(table.name)}
                                >
                                  Copy name
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>

                            {isOpen(tableKey) && (
                              <>
                                <div
                                  className="flex cursor-pointer items-center gap-1 py-0.5 pl-[4.5rem] pr-2 hover:bg-tree-hover"
                                  onClick={() => toggle(colsKey)}
                                >
                                  {isOpen(colsKey) ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <Columns3 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs">columns</span>
                                </div>
                                {isOpen(colsKey) && (
                                  <>
                                    {activeTable === table.name && columnsLoading && (
                                      <p className="pl-24 text-xs text-muted-foreground">Loading...</p>
                                    )}
                                    {tableCols.map((col: ColumnInfo) => (
                                      <ContextMenu key={col.name}>
                                        <ContextMenuTrigger asChild>
                                          <div
                                            className="flex cursor-pointer items-center gap-1 py-0.5 pl-24 pr-2 hover:bg-tree-hover"
                                            onDoubleClick={() => insertIntoActiveEditor(col.name)}
                                            title={`${col.type}${col.key ? ` · ${col.key}` : ''}`}
                                          >
                                            <Columns3 className="h-3 w-3 text-muted-foreground" />
                                            <span className="truncate text-xs">
                                              {col.name}: {col.type}
                                              {col.extra ? ` [${col.extra}]` : ''}
                                            </span>
                                          </div>
                                        </ContextMenuTrigger>
                                        <ContextMenuContent>
                                          <ContextMenuItem
                                            onClick={() => insertIntoActiveEditor(col.name)}
                                          >
                                            Insert name
                                          </ContextMenuItem>
                                          <ContextMenuItem
                                            onClick={() => navigator.clipboard.writeText(col.name)}
                                          >
                                            Copy name
                                          </ContextMenuItem>
                                        </ContextMenuContent>
                                      </ContextMenu>
                                    ))}
                                  </>
                                )}
                                <div className="flex items-center gap-1 py-0.5 pl-[4.5rem] pr-2 opacity-40">
                                  <Key className="h-3 w-3" />
                                  <span className="text-xs">keys</span>
                                </div>
                                <div className="flex items-center gap-1 py-0.5 pl-[4.5rem] pr-2 opacity-40">
                                  <Link2 className="h-3 w-3" />
                                  <span className="text-xs">foreign keys</span>
                                </div>
                                <div className="flex items-center gap-1 py-0.5 pl-[4.5rem] pr-2 opacity-40">
                                  <ListTree className="h-3 w-3" />
                                  <span className="text-xs">indexes</span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {databases
                    .filter((db) => db.name !== currentDatabase)
                    .map((db) => (
                      <div
                        key={db.name}
                        className="flex items-center gap-1 py-0.5 pl-9 pr-2 opacity-50"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>{db.name}</span>
                      </div>
                    ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
