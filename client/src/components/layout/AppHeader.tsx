import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, RefreshCw, LogOut, Database, FileUp, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ThemePicker from '@/components/theme/ThemePicker';
import { useDatabases } from '@/hooks/useDatabases';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';
import { useWorkspaceStore } from '@/stores/workspaceStore';

import { DatabaseInfo } from '@/types';

function pickDefaultDatabase(
  databases: DatabaseInfo[],
  current: string | null,
  loginDatabase?: string
): string | null {
  if (databases.length === 0) return loginDatabase ?? null;
  const names = new Set(databases.map((db) => db.name));
  if (current && names.has(current)) return current;
  if (loginDatabase && names.has(loginDatabase)) return loginDatabase;
  return databases[0].name;
}

export default function AppHeader() {
  const navigate = useNavigate();
  const openToolPanel = useWorkspaceStore((s) => s.openToolPanel);
  const { logout } = useAuth();
  const { data: databases = [], isLoading, isError, error, refetch, isFetching } = useDatabases();
  const { currentDatabase, setDatabases, setCurrentDatabase } = useDatabaseStore();
  const connection = useAuthStore((state) => state.connection);

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  useEffect(() => {
    if (databases.length > 0) setDatabases(databases);
    const next = pickDefaultDatabase(databases, currentDatabase, connection?.database);
    if (next && next !== currentDatabase) setCurrentDatabase(next);
  }, [databases, currentDatabase, connection?.database, setDatabases, setCurrentDatabase]);

  const selectValue =
    currentDatabase && databases.some((db) => db.name === currentDatabase)
      ? currentDatabase
      : undefined;

  return (
    <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-title-bar px-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-primary">Elendra</span>
        <div className="flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
          <Select
            value={selectValue}
            onValueChange={setCurrentDatabase}
            disabled={isLoading || databases.length === 0}
          >
            <SelectTrigger className="h-7 w-44 text-xs">
              <SelectValue placeholder={isLoading ? 'Loading...' : 'Select database'} />
            </SelectTrigger>
            <SelectContent>
              {databases.map((db) => (
                <SelectItem key={db.name} value={db.name}>
                  {db.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => refetch()}
                disabled={isLoading || isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh databases</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                navigate('/');
                openToolPanel('query-builder');
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Query Builder
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                navigate('/');
                openToolPanel('dump');
              }}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Dump Import
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => document.dispatchEvent(new CustomEvent('elendra:open-command-palette'))}>
              Command Palette…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {connection && (
          <Badge variant="outline" className="text-[10px] hidden sm:flex">
            {connection.type} · {connection.host}
          </Badge>
        )}
        <ThemePicker />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Logout</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
