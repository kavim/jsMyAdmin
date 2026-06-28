import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Minus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableDataTab, useWorkspaceStore } from '@/stores/workspaceStore';
import { useTableData } from '@/hooks/useTableData';
import { tableApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface TableDataViewProps {
  tab: TableDataTab;
}

export default function TableDataView({ tab }: TableDataViewProps) {
  const updateTableTab = useWorkspaceStore((s) => s.updateTableTab);
  const [whereDraft, setWhereDraft] = useState(tab.where);
  const [orderDraft, setOrderDraft] = useState(tab.orderBy);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch, error } = useTableData({
    database: tab.database,
    table: tab.table,
    page: tab.page,
    limit: tab.limit,
    where: tab.where || undefined,
    orderBy: tab.orderBy || undefined,
  });

  const applyFilters = () => {
    updateTableTab(tab.id, { where: whereDraft, orderBy: orderDraft, page: 1 });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / tab.limit)) : 1;

  const handleDelete = async () => {
    if (selectedRow === null || !data) return;
    const row = data.rows[selectedRow];
    try {
      await tableApi.deleteRow(tab.database, tab.table, row as Record<string, unknown>);
      toast.success('Row deleted');
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleAddRow = async () => {
    if (!data?.columns.length) return;
    const payload: Record<string, unknown> = {};
    for (const col of data.columns) {
      if (col === 'id') continue;
      payload[col] = '';
    }
    try {
      await tableApi.insertRow(tab.database, tab.table, payload);
      toast.success('Row added');
      await refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-editor">
      <div className="flex flex-wrap items-end gap-2 border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase text-muted-foreground">WHERE</Label>
          <Input
            value={whereDraft}
            onChange={(e) => setWhereDraft(e.target.value)}
            placeholder="id > 0"
            className="h-7 w-40 font-mono text-xs"
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase text-muted-foreground">ORDER BY</Label>
          <Input
            value={orderDraft}
            onChange={(e) => setOrderDraft(e.target.value)}
            placeholder="id DESC"
            className="h-7 w-40 font-mono text-xs"
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={applyFilters}>
          Apply
        </Button>
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAddRow} title="Add row">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDelete} title="Delete row">
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" disabled title="Export CSV (soon)">
            <Upload className="h-3 w-3" />
            CSV
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        )}
        {error && (
          <p className="p-4 text-sm text-destructive">{getErrorMessage(error)}</p>
        )}
        {data && !isLoading && (
          <Table>
            <TableHeader>
              <TableRow className="bg-grid-header hover:bg-grid-header">
                {data.columns.map((col) => (
                  <TableHead key={col} className="font-mono text-xs whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, i) => (
                <TableRow
                  key={i}
                  className={i % 2 === 1 ? 'bg-grid-row-alt' : undefined}
                  data-state={selectedRow === i ? 'selected' : undefined}
                  onClick={() => setSelectedRow(i)}
                >
                  {data.columns.map((col) => (
                    <TableCell key={col} className="font-mono text-xs max-w-[200px] truncate">
                      {row[col] == null ? (
                        <span className="text-muted-foreground italic">NULL</span>
                      ) : (
                        String(row[col])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between border-t border-border bg-status-bar px-3 py-1 text-[10px] text-muted-foreground">
        <span>
          {data ? `${data.total} row${data.total === 1 ? '' : 's'}` : '—'}
          {selectedRow !== null ? ` · ${selectedRow + 1} selected` : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={tab.page <= 1}
            onClick={() => updateTableTab(tab.id, { page: tab.page - 1 })}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span>
            {tab.page} / {totalPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={tab.page >= totalPages}
            onClick={() => updateTableTab(tab.id, { page: tab.page + 1 })}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
