import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { QueryResult } from '@/types';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  result: QueryResult | null;
  error: string | null;
  isExecuting: boolean;
}

function formatValue(value: unknown): string {
  if (value === null) return 'NULL';
  if (value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function isNullValue(value: unknown): boolean {
  return value === null || value === undefined;
}

export default function ResultsPanel({ result, error, isExecuting }: ResultsPanelProps) {
  if (isExecuting) {
    return (
      <div className="flex h-full flex-col gap-2 bg-background p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col bg-background p-4">
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{error}</pre>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Run query with Ctrl+Enter — results appear here
      </div>
    );
  }

  const isSelect = result.rows.length > 0 || result.columns.length > 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-4 border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
        {isSelect ? (
          <>
            <Badge variant="secondary">
              {result.rows.length.toLocaleString()} row{result.rows.length !== 1 ? 's' : ''}
            </Badge>
            <span>{result.columns.length} column{result.columns.length !== 1 ? 's' : ''}</span>
          </>
        ) : (
          <Badge variant="secondary">
            {result.affectedRows} row{result.affectedRows !== 1 ? 's' : ''} affected
            {result.insertId != null && ` · insert id: ${result.insertId}`}
          </Badge>
        )}
        <span className="ml-auto">{result.time}ms</span>
      </div>

      {isSelect && result.rows.length > 0 ? (
        <ScrollArea className="flex-1">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-muted">
              <tr>
                <th className="w-10 border-b border-r border-border px-2 py-1.5 text-right font-normal text-muted-foreground">
                  #
                </th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-r border-border px-3 py-1.5 text-left font-medium whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn('hover:bg-accent/50', i % 2 === 0 ? 'bg-background' : 'bg-muted/30')}
                >
                  <td className="border-r border-border/50 px-2 py-1 text-right text-muted-foreground">
                    {i + 1}
                  </td>
                  {result.columns.map((col) => (
                    <td
                      key={col}
                      className={cn(
                        'max-w-xs truncate border-r border-border/50 px-3 py-1 font-mono',
                        isNullValue(row[col]) ? 'text-muted-foreground italic' : 'text-foreground'
                      )}
                      title={formatValue(row[col])}
                    >
                      {formatValue(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      ) : isSelect ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Empty result set
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-primary">
          Query executed successfully
        </div>
      )}
    </div>
  );
}
