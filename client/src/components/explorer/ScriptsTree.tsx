import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FolderOpen,
  FolderPlus,
  FilePlus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useScripts, useCreateScriptFolder, useDeleteScript, readScriptFile } from '@/hooks/useScripts';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { ScriptNode } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

function collectFolders(nodes: ScriptNode[], prefix = ''): string[] {
  const folders: string[] = prefix ? [prefix] : [];
  for (const node of nodes) {
    if (node.kind === 'folder') {
      folders.push(node.path);
      if (node.children) {
        folders.push(...collectFolders(node.children, node.path));
      }
    }
  }
  return folders;
}

interface ScriptsTreeProps {
  onNewFile?: (folderPath: string) => void;
}

function ScriptNodeRow({
  node,
  depth,
  expanded,
  toggle,
  onOpenFile,
  onNewFile,
  onNewFolder,
  onDelete,
}: {
  node: ScriptNode;
  depth: number;
  expanded: Set<string>;
  toggle: (path: string) => void;
  onOpenFile: (path: string) => void;
  onNewFile: (folderPath: string) => void;
  onNewFolder: (parentPath: string) => void;
  onDelete: (path: string, kind: 'file' | 'folder') => void;
}) {
  const isOpen = expanded.has(node.path);
  const padding = 8 + depth * 12;

  if (node.kind === 'folder') {
    return (
      <div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className="flex cursor-pointer items-center gap-1 py-0.5 pr-2 hover:bg-tree-hover"
              style={{ paddingLeft: padding }}
              onClick={() => toggle(node.path)}
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <span className="truncate text-xs">{node.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onNewFile(node.path)}>
              <FilePlus className="mr-2 h-3.5 w-3.5" />
              New file
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onNewFolder(node.path)}>
              <FolderPlus className="mr-2 h-3.5 w-3.5" />
              New folder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-destructive" onClick={() => onDelete(node.path, 'folder')}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isOpen &&
          node.children?.map((child) => (
            <ScriptNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              toggle={toggle}
              onOpenFile={onOpenFile}
              onNewFile={onNewFile}
              onNewFolder={onNewFolder}
              onDelete={onDelete}
            />
          ))}
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="flex cursor-pointer items-center gap-1 py-0.5 pr-2 hover:bg-tree-hover"
          style={{ paddingLeft: padding + 14 }}
          onDoubleClick={() => onOpenFile(node.path)}
        >
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span className="truncate text-xs">{node.name}</span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onOpenFile(node.path)}>Open</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive" onClick={() => onDelete(node.path, 'file')}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function ScriptsTree({ onNewFile }: ScriptsTreeProps) {
  const { data: tree = [], isLoading, refetch, isFetching } = useScripts();
  const createFolder = useCreateScriptFolder();
  const deleteScript = useDeleteScript();
  const { openScriptTab } = useWorkspaceStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set(['scripts-root']));

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleOpenFile = async (path: string) => {
    try {
      const file = await readScriptFile(path);
      openScriptTab(file.path, file.content);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleNewFolder = async (parentPath: string) => {
    const name = window.prompt('Folder name:');
    if (!name?.trim()) return;
    const path = parentPath ? `${parentPath}/${name.trim()}` : name.trim();
    try {
      await createFolder.mutateAsync(path);
      setExpanded((prev) => new Set(prev).add(parentPath || path).add('scripts-root'));
      toast.success('Folder created');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleNewFile = (folderPath: string) => {
    onNewFile?.(folderPath);
  };

  const handleDelete = async (path: string, kind: 'file' | 'folder') => {
    const label = kind === 'folder' ? 'folder and all contents' : 'file';
    if (!window.confirm(`Delete ${label} "${path}"?`)) return;
    try {
      await deleteScript.mutateAsync(path);
      toast.success('Deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col border-b border-border">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Scripts
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New file"
            onClick={() => handleNewFile('')}
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New folder"
            onClick={() => handleNewFolder('')}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-48">
        <div className="py-1 text-sm">
          {isLoading && (
            <div className="space-y-1 px-3 py-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          )}
          {!isLoading && tree.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No scripts yet. Create one with + or save a console.
            </p>
          )}
          {tree.map((node) => (
            <ScriptNodeRow
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              toggle={toggle}
              onOpenFile={handleOpenFile}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export { collectFolders };
