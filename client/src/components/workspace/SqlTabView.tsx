import { useCallback, useRef, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Play, AlignLeft, Clock, ChevronDown, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SplitPane } from '@/components/ui/split-pane';
import SqlEditor, { SqlEditorHandle, StatementExecutionState } from '@/components/query/SqlEditor';
import ResultsPanel from '@/components/query/ResultsPanel';
import { useTables } from '@/hooks/useTables';
import { useExecuteQuery } from '@/hooks/useExecuteQuery';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useWorkspaceStore, SqlTab } from '@/stores/workspaceStore';
import { formatSql } from '@/lib/formatSql';
import { getErrorMessage } from '@/lib/errors';
import { notifyQueryError, notifyQuerySuccess } from '@/lib/notifications';
import { queryApi } from '@/lib/api';
import { useSaveScript } from '@/hooks/useScripts';
import SaveScriptDialog from './SaveScriptDialog';

interface SqlTabViewProps {
  tab: SqlTab;
}

export default function SqlTabView({ tab }: SqlTabViewProps) {
  const queryClient = useQueryClient();
  const { currentDatabase, setTables } = useDatabaseStore();
  const {
    setTabSql,
    setTabResult,
    setTabError,
    setExecuting,
    addToHistory,
    isExecuting,
    history,
    columnsByTable,
    registerInsertTextHandler,
    registerSaveHandler,
    markTabSaved,
    pendingSaveAsFolder,
    consumePendingSaveAs,
    activeTabId,
  } = useWorkspaceStore();

  const saveScript = useSaveScript();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveDialogFolder, setSaveDialogFolder] = useState('');
  const [saveDialogName, setSaveDialogName] = useState('');

  const { data: schemaTables = [] } = useTables(currentDatabase);
  const executeQuery = useExecuteQuery();

  const editorRef = useRef<SqlEditorHandle>(null);
  const [statementExecution, setStatementExecution] = useState<StatementExecutionState | null>(null);

  useEffect(() => {
    registerInsertTextHandler((text) => editorRef.current?.insertText(text));
    useWorkspaceStore.getState().consumePendingInsert();
    return () => registerInsertTextHandler(null);
  }, [registerInsertTextHandler, tab.id]);

  const openSaveAs = useCallback(
    (folder = '', name = '') => {
      setSaveDialogFolder(folder);
      setSaveDialogName(name || (tab.filePath ? tab.filePath.split('/').pop()! : ''));
      setSaveDialogOpen(true);
    },
    [tab.filePath]
  );

  const persistScript = useCallback(
    async (path: string) => {
      const sql = tab.sql;
      try {
        await saveScript.mutateAsync({ path, content: sql });
        markTabSaved(tab.id, path, sql);
        toast.success(`Saved ${path}`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    },
    [tab.id, tab.sql, saveScript, markTabSaved]
  );

  const handleSave = useCallback(() => {
    if (tab.filePath) {
      persistScript(tab.filePath);
    } else {
      openSaveAs();
    }
  }, [tab.filePath, persistScript, openSaveAs]);

  useEffect(() => {
    if (activeTabId !== tab.id) return;
    registerSaveHandler(handleSave);
    return () => registerSaveHandler(null);
  }, [activeTabId, tab.id, handleSave, registerSaveHandler]);

  useEffect(() => {
    if (activeTabId !== tab.id || pendingSaveAsFolder === null) return;
    const folder = consumePendingSaveAs();
    if (folder !== null) openSaveAs(folder);
  }, [activeTabId, tab.id, pendingSaveAsFolder, consumePendingSaveAs, openSaveAs]);

  useEffect(() => {
    if (statementExecution?.status !== 'success' && statementExecution?.status !== 'error') return;
    const timer = setTimeout(() => setStatementExecution(null), 3000);
    return () => clearTimeout(timer);
  }, [statementExecution]);

  const resolveExecuteSql = useCallback(
    (sqlOverride?: string) => {
      const override = sqlOverride?.trim();
      if (override) return override;
      const fromEditor = editorRef.current?.getExecutableSql().trim();
      if (fromEditor) return fromEditor;
      return tab.sql.trim();
    },
    [tab.sql]
  );

  const handleExecute = useCallback(
    async (sqlOverride?: string, statementKey?: string) => {
      if (!currentDatabase) {
        toast.error('Select a database first');
        return;
      }

      const sql = resolveExecuteSql(sqlOverride);
      if (!sql) {
        toast.error('Nothing to execute');
        return;
      }

      const key = statementKey ?? editorRef.current?.getExecutableStatement().key ?? 'unknown';

      setExecuting(true);
      setStatementExecution({ key, status: 'running' });
      setTabError(tab.id, null);

      try {
        const result = await executeQuery.mutateAsync({ database: currentDatabase, sql });
        setTabResult(tab.id, result);
        addToHistory(sql);
        setStatementExecution({ key, status: 'success' });
        notifyQuerySuccess(`Query executed in ${result.time}ms`);
        await queryClient.invalidateQueries({ queryKey: ['tables', currentDatabase] });
        const freshTables = queryClient.getQueryData<typeof schemaTables>(['tables', currentDatabase]);
        if (freshTables) setTables(freshTables);
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        setTabError(tab.id, message);
        setStatementExecution({ key, status: 'error' });
        notifyQueryError(message);
      } finally {
        setExecuting(false);
      }
    },
    [
      currentDatabase,
      tab.id,
      resolveExecuteSql,
      setExecuting,
      setTabError,
      setTabResult,
      addToHistory,
      setTables,
      executeQuery,
      queryClient,
    ]
  );

  const handleFormat = () => {
    setTabSql(tab.id, formatSql(tab.sql));
  };

  const loadHistoryItem = (sql: string) => {
    setTabSql(tab.id, sql);
  };

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (!currentDatabase) return;
      const sql = resolveExecuteSql();
      if (!sql) return;

      try {
        const res = await queryApi.export(currentDatabase, sql, format);
        const blob = res.data;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.' + format;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Exported as ' + format.toUpperCase());
      } catch {
        toast.error('Export failed');
      }
    },
    [currentDatabase, resolveExecuteSql]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-editor">
      <SaveScriptDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        defaultFolder={saveDialogFolder}
        defaultName={saveDialogName}
        onSave={persistScript}
      />
      <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={handleSave}
              disabled={saveScript.isPending}
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </Button>
          </TooltipTrigger>
          <TooltipContent>Save (Ctrl+S)</TooltipContent>
        </Tooltip>

        <Button variant="ghost" size="sm" className="text-xs" onClick={() => openSaveAs()}>
          Save As
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              <Clock className="h-3.5 w-3.5" />
              History
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 max-h-64 overflow-auto">
            {history.length === 0 ? (
              <DropdownMenuItem disabled>No history yet</DropdownMenuItem>
            ) : (
              history.map((item, i) => (
                <DropdownMenuItem
                  key={i}
                  className="flex flex-col items-start gap-0.5"
                  onClick={() => loadHistoryItem(item.sql)}
                >
                  <span className="truncate font-mono text-xs w-full">{item.sql}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleFormat}>
              <AlignLeft className="h-3.5 w-3.5" />
              Format
            </Button>
          </TooltipTrigger>
          <TooltipContent>Format SQL (Ctrl+Alt+L)</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs gap-1" disabled={!tab.result}>
              <Download className="h-3.5 w-3.5" />
              Export
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => handleExecute()}
          disabled={isExecuting || !currentDatabase}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {isExecuting ? 'Running...' : 'Execute'}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SplitPane
          direction="vertical"
          defaultRatio={0.55}
          minFirst={0.1}
          minSecond={0.1}
          first={
            <div className="h-full min-h-0 overflow-hidden bg-editor">
              <SqlEditor
                ref={editorRef}
                key={tab.id}
                value={tab.sql}
                onChange={(v) => setTabSql(tab.id, v)}
                onExecute={handleExecute}
                tables={schemaTables}
                columnsByTable={columnsByTable}
                statementExecution={statementExecution}
              />
            </div>
          }
          second={
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="flex items-center border-b border-border bg-card px-3 py-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Output
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <ResultsPanel result={tab.result} error={tab.error} isExecuting={isExecuting} />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
