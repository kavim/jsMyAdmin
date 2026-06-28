import { useState, useMemo } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Play, Plus, X, Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useTables } from '@/hooks/useTables';
import { useAllTableColumns } from '@/hooks/useAllTableColumns';
import { useExecuteQuery } from '@/hooks/useExecuteQuery';
import { useDatabaseStore } from '@/stores/databaseStore';
import { useQueryStore } from '@/stores/queryStore';
import { getErrorMessage } from '@/lib/errors';

interface JoinConfig {
  id: string;
  table: string;
  column: string;
  refTable: string;
  refColumn: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

interface Condition {
  id: string;
  column: string;
  operator: string;
  value: string;
}

const executeSchema = z.object({
  tables: z.array(z.string()).min(1, 'Select at least one table'),
  sql: z.string().min(1, 'Generated SQL is empty'),
});

export default function QueryBuilderPage() {
  const { currentDatabase } = useDatabaseStore();
  const { setResult, setExecuting, addToHistory } = useQueryStore();
  const { data: tables = [], isLoading: tablesLoading } = useTables(currentDatabase);
  const { tableColumns, isLoading: columnsLoading } = useAllTableColumns(currentDatabase, tables);
  const executeQuery = useExecuteQuery();

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Record<string, string[]>>({});
  const [joins] = useState<JoinConfig[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [orderBy, setOrderBy] = useState<{ column: string; direction: 'ASC' | 'DESC' }>({
    column: '',
    direction: 'ASC',
  });
  const [limit, setLimit] = useState(100);

  const generatedSql = useMemo(() => {
    if (selectedTables.length === 0) return '';

    const columns = Object.entries(selectedColumns)
      .flatMap(([table, cols]) =>
        cols.length > 0
          ? cols.map((c) => '`' + table + '`.`' + c + '`')
          : ['`' + table + '`.*']
      )
      .join(',\n  ');

    let sql = 'SELECT\n  ' + columns + '\nFROM `' + selectedTables[0] + '`';

    for (const join of joins) {
      sql +=
        '\n' +
        join.type +
        ' JOIN `' +
        join.table +
        '` ON `' +
        join.table +
        '`.`' +
        join.column +
        '` = `' +
        join.refTable +
        '`.`' +
        join.refColumn +
        '`';
    }

    if (conditions.length > 0) {
      const whereClauses = conditions
        .map((c) => {
          if (!c.column) return '';
          if (c.operator === 'IS NULL' || c.operator === 'IS NOT NULL') {
            return '`' + c.column + '` ' + c.operator;
          }
          if (c.operator === 'LIKE') {
            return '`' + c.column + '` LIKE \'' + c.value + '\'';
          }
          if (c.operator === 'IN') {
            return '`' + c.column + '` IN (' + c.value + ')';
          }
          return '`' + c.column + '` ' + c.operator + ' \'' + c.value + '\'';
        })
        .filter(Boolean);

      if (whereClauses.length > 0) {
        sql += '\nWHERE ' + whereClauses.join('\n  AND ');
      }
    }

    if (orderBy.column) {
      sql += '\nORDER BY `' + orderBy.column + '` ' + orderBy.direction;
    }

    if (limit) {
      sql += '\nLIMIT ' + limit;
    }

    return sql + ';';
  }, [selectedTables, selectedColumns, joins, conditions, orderBy, limit]);

  const toggleTable = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter((t) => t !== tableName));
      const newCols = { ...selectedColumns };
      delete newCols[tableName];
      setSelectedColumns(newCols);
    } else {
      setSelectedTables([...selectedTables, tableName]);
      setSelectedColumns({ ...selectedColumns, [tableName]: [] });
    }
  };

  const toggleColumn = (tableName: string, columnName: string) => {
    const tableCols = selectedColumns[tableName] || [];
    if (tableCols.includes(columnName)) {
      setSelectedColumns({
        ...selectedColumns,
        [tableName]: tableCols.filter((c) => c !== columnName),
      });
    } else {
      setSelectedColumns({
        ...selectedColumns,
        [tableName]: [...tableCols, columnName],
      });
    }
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { id: Date.now().toString(), column: '', operator: '=', value: '' },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const executeGenerated = async () => {
    if (!currentDatabase) return;

    const validation = executeSchema.safeParse({
      tables: selectedTables,
      sql: generatedSql,
    });

    if (!validation.success) {
      const msg = validation.error.errors[0]?.message ?? 'Invalid query configuration';
      toast.error(msg);
      return;
    }

    setExecuting(true);

    try {
      const result = await executeQuery.mutateAsync({
        database: currentDatabase,
        sql: generatedSql,
      });
      setResult(result);
      addToHistory(generatedSql);
      toast.success(`Query executed in ${result.time}ms`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setExecuting(false);
    }
  };

  const isLoading = tablesLoading || columnsLoading;

  return (
    <div className="h-full flex flex-col gap-4">
      <Tabs defaultValue="builder" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="builder">Visual Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview SQL</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tables.map((table) => (
                        <div key={table.name} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTables.includes(table.name)}
                            onCheckedChange={() => toggleTable(table.name)}
                          />
                          <span className="text-sm">{table.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Columns</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {selectedTables.map((table) => (
                    <div key={table}>
                      <div className="text-xs font-medium text-muted-foreground mb-1">{table}</div>
                      {tableColumns[table]?.map((col) => (
                        <div key={col.name} className="flex items-center gap-2 ml-2">
                          <Checkbox
                            checked={(selectedColumns[table] || []).includes(col.name)}
                            onCheckedChange={() => toggleColumn(table, col.name)}
                          />
                          <span className="text-sm">{col.name}</span>
                          <span className="text-xs text-muted-foreground">({col.type})</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters & Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Conditions</Label>
                  {conditions.map((c) => (
                    <div key={c.id} className="flex items-center gap-1 mt-1">
                      <Input
                        placeholder="column"
                        value={c.column}
                        onChange={(e) =>
                          setConditions(
                            conditions.map((cn) =>
                              cn.id === c.id ? { ...cn, column: e.target.value } : cn
                            )
                          )
                        }
                        className="h-8 text-xs"
                      />
                      <Select
                        value={c.operator}
                        onValueChange={(val) =>
                          setConditions(
                            conditions.map((cn) =>
                              cn.id === c.id ? { ...cn, operator: val } : cn
                            )
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="=">=</SelectItem>
                          <SelectItem value="!=">!=</SelectItem>
                          <SelectItem value=">">&gt;</SelectItem>
                          <SelectItem value="<">&lt;</SelectItem>
                          <SelectItem value="LIKE">LIKE</SelectItem>
                          <SelectItem value="IN">IN</SelectItem>
                          <SelectItem value="IS NULL">NULL</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="value"
                        value={c.value}
                        onChange={(e) =>
                          setConditions(
                            conditions.map((cn) =>
                              cn.id === c.id ? { ...cn, value: e.target.value } : cn
                            )
                          )
                        }
                        className="h-8 text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeCondition(c.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2" onClick={addCondition}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Order By</Label>
                  <div className="flex gap-1 mt-1">
                    <Select
                      value={orderBy.column}
                      onValueChange={(val) => setOrderBy({ ...orderBy, column: val })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTables.flatMap((t) =>
                          (tableColumns[t] || []).map((c) => (
                            <SelectItem key={t + '.' + c.name} value={t + '.' + c.name}>
                              {t}.{c.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Select
                      value={orderBy.direction}
                      onValueChange={(val) =>
                        setOrderBy({ ...orderBy, direction: val as 'ASC' | 'DESC' })
                      }
                    >
                      <SelectTrigger className="h-8 w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASC">ASC</SelectItem>
                        <SelectItem value="DESC">DESC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Limit</Label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                    className="mt-1"
                  />
                </div>

                <Button onClick={executeGenerated} className="w-full" disabled={executeQuery.isPending}>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Generated SQL</CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              <pre className="font-mono text-sm whitespace-pre-wrap bg-muted p-4 rounded-md overflow-auto h-full">
                {generatedSql || '-- Select tables and columns to generate SQL'}
              </pre>
              <Button
                onClick={executeGenerated}
                className="mt-4"
                disabled={!generatedSql || executeQuery.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Query
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
