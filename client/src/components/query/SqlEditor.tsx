import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor, languages } from 'monaco-editor';
import { SQL_KEYWORDS } from '@/lib/sqlKeywords';
import {
  getStatementKey,
  getStatementRangeAtLine,
  getStatementRangeAtOffset,
  offsetToPosition,
  positionToOffset,
  type StatementRange,
} from '@/lib/getStatementAtCursor';
import { ColumnInfo, TableInfo } from '@/types';
import { registerMonacoThemes, getMonacoThemeId } from '@/themes';
import { useThemeStore } from '@/stores/themeStore';

export interface ExecutableStatement {
  sql: string;
  key: string;
}

export interface StatementExecutionState {
  key: string;
  status: 'running' | 'success' | 'error';
}

export interface SqlEditorHandle {
  insertText: (text: string) => void;
  getExecutableSql: () => string;
  getExecutableStatement: () => ExecutableStatement;
  getValue: () => string;
}

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (sql?: string, statementKey?: string) => void;
  tables: TableInfo[];
  columnsByTable: Record<string, ColumnInfo[]>;
  readOnly?: boolean;
  statementExecution?: StatementExecutionState | null;
}

const STATEMENT_HIGHLIGHT_CLASS = 'sql-active-statement';

function trimStatementRange(fullText: string, range: StatementRange) {
  const raw = fullText.slice(range.start, range.end);
  const leading = raw.length - raw.trimStart().length;
  const trailing = raw.length - raw.trimEnd().length;
  const trimStart = range.start + leading;
  const trimEnd = range.end - trailing;
  return {
    start: offsetToPosition(fullText, trimStart),
    end: offsetToPosition(fullText, trimEnd),
    key: getStatementKey(range),
    sql: range.text,
  };
}

function resolveExecutableStatement(ed: editor.ICodeEditor, fallbackText = ''): ExecutableStatement {
  const model = ed.getModel();
  if (!model) return { sql: fallbackText.trim(), key: 'fallback' };

  const selection = ed.getSelection();
  if (selection && !selection.isEmpty()) {
    const selected = model.getValueInRange(selection).trim();
    if (selected) {
      const start = model.getOffsetAt(selection.getStartPosition());
      const end = model.getOffsetAt(selection.getEndPosition());
      return { sql: selected, key: `sel:${start}:${end}` };
    }
  }

  const fullText = model.getValue();
  if (!fullText.trim()) return { sql: fallbackText.trim(), key: 'fallback' };

  const position = ed.getPosition();
  if (!position) return { sql: fullText.trim(), key: `full:0:${fullText.length}` };

  const offset = positionToOffset(fullText, position.lineNumber, position.column);
  const range = getStatementRangeAtOffset(fullText, offset);
  if (!range) return { sql: fullText.trim(), key: `full:0:${fullText.length}` };

  return trimStatementRange(fullText, range);
}

function gutterClassForKey(
  statementKey: string,
  execution?: StatementExecutionState | null
): string {
  if (!execution || execution.key !== statementKey) return 'sql-gutter-play';
  if (execution.status === 'running') return 'sql-gutter-running';
  if (execution.status === 'success') return 'sql-gutter-success';
  return 'sql-gutter-error';
}

function updateStatementDecorations(
  ed: editor.IStandaloneCodeEditor,
  decorationIds: string[],
  execution?: StatementExecutionState | null
): string[] {
  const model = ed.getModel();
  if (!model) return decorationIds;

  const fullText = model.getValue();
  const position = ed.getPosition();
  if (!position || !fullText.trim()) {
    return ed.deltaDecorations(decorationIds, []);
  }

  const offset = positionToOffset(fullText, position.lineNumber, position.column);
  const range = getStatementRangeAtOffset(fullText, offset);
  if (!range) {
    return ed.deltaDecorations(decorationIds, []);
  }

  const trimmed = trimStatementRange(fullText, range);

  return ed.deltaDecorations(decorationIds, [
    {
      range: {
        startLineNumber: trimmed.start.line,
        startColumn: trimmed.start.column,
        endLineNumber: trimmed.end.line,
        endColumn: trimmed.end.column,
      },
      options: {
        isWholeLine: false,
        className: STATEMENT_HIGHLIGHT_CLASS,
      },
    },
    {
      range: {
        startLineNumber: trimmed.start.line,
        startColumn: 1,
        endLineNumber: trimmed.start.line,
        endColumn: 1,
      },
      options: {
        isWholeLine: false,
        glyphMarginClassName: gutterClassForKey(trimmed.key, execution),
        glyphMarginHoverMessage: { value: 'Execute statement (Ctrl+Enter)' },
      },
    },
  ]);
}

const SqlEditor = forwardRef<SqlEditorHandle, SqlEditorProps>(function SqlEditor(
  {
    value,
    onChange,
    onExecute,
    tables,
    columnsByTable,
    readOnly = false,
    statementExecution = null,
  },
  ref
) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onExecuteRef = useRef(onExecute);
  onExecuteRef.current = onExecute;
  const statementExecutionRef = useRef(statementExecution);
  statementExecutionRef.current = statementExecution;
  const themeId = useThemeStore((s) => s.themeId);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  const refreshDecorations = useCallback((ed: editor.IStandaloneCodeEditor) => {
    decorationIdsRef.current = updateStatementDecorations(
      ed,
      decorationIdsRef.current,
      statementExecutionRef.current
    );
  }, []);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const ed = editorRef.current;
      if (!ed) return;
      const selection = ed.getSelection();
      if (selection) {
        ed.executeEdits('insert', [{ range: selection, text, forceMoveMarkers: true }]);
      }
      ed.focus();
    },
    getExecutableSql: () => {
      const ed = editorRef.current;
      const fallback = valueRef.current;
      if (!ed) return fallback.trim();
      return resolveExecutableStatement(ed, fallback).sql;
    },
    getExecutableStatement: () => {
      const ed = editorRef.current;
      const fallback = valueRef.current;
      if (!ed) return { sql: fallback.trim(), key: 'fallback' };
      return resolveExecutableStatement(ed, fallback);
    },
    getValue: () => editorRef.current?.getValue() ?? '',
  }));

  const scheduleHighlight = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => refreshDecorations(ed), 100);
    },
    [refreshDecorations]
  );

  const handleBeforeMount = useCallback((monaco: typeof import('monaco-editor')) => {
    monacoRef.current = monaco;
    registerMonacoThemes(monaco);
  }, []);

  const handleMount: OnMount = useCallback(
    (ed, monaco) => {
      editorRef.current = ed;
      monacoRef.current = monaco;
      monaco.editor.setTheme(getMonacoThemeId(themeId));

      ed.addAction({
        id: 'elendra.executeStatement',
        label: 'Execute Statement',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: 'navigation',
        run: (editor) => {
          const { sql, key } = resolveExecutableStatement(editor, valueRef.current);
          onExecuteRef.current(sql, key);
        },
      });

      ed.onDidChangeCursorPosition(() => scheduleHighlight(ed));
      ed.onDidChangeModelContent(() => scheduleHighlight(ed));

      ed.onMouseDown((e) => {
        if (
          e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
          !e.event.leftButton
        ) {
          return;
        }

        const line = e.target.position?.lineNumber;
        if (!line) return;

        const model = ed.getModel();
        if (!model) return;

        const fullText = model.getValue();
        const range = getStatementRangeAtLine(fullText, line);
        if (!range) return;

        const { sql, key } = trimStatementRange(fullText, range);
        if (!sql) return;

        onExecuteRef.current(sql, key);
      });

      scheduleHighlight(ed);

      ed.updateOptions({
        glyphMargin: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 8, bottom: 8 },
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        suggestOnTriggerCharacters: true,
        quickSuggestions: { other: true, strings: true, comments: false },
      });
    },
    [scheduleHighlight, themeId]
  );

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    monaco.editor.setTheme(getMonacoThemeId(themeId));
  }, [themeId]);

  useEffect(() => {
    const ed = editorRef.current;
    if (ed) refreshDecorations(ed);
  }, [statementExecution, refreshDecorations]);

  useEffect(() => {
    let disposable: { dispose: () => void } | undefined;

    import('monaco-editor').then((monaco) => {
      disposable = monaco.languages.registerCompletionItemProvider('sql', {
        triggerCharacters: ['.', ' ', '`'],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions: languages.CompletionItem[] = [];

          for (const kw of SQL_KEYWORDS) {
            suggestions.push({
              label: kw,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: kw,
              range,
            });
          }

          for (const table of tables) {
            suggestions.push({
              label: table.name,
              kind: monaco.languages.CompletionItemKind.Class,
              detail: table.engine ? `engine: ${table.engine}` : 'table',
              insertText: table.name,
              range,
            });

            const cols = columnsByTable[table.name] ?? [];
            for (const col of cols) {
              suggestions.push({
                label: `${table.name}.${col.name}`,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: col.type,
                insertText: `${table.name}.${col.name}`,
                range,
              });
              suggestions.push({
                label: col.name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: `${table.name} · ${col.type}`,
                insertText: col.name,
                range,
              });
            }
          }

          return { suggestions };
        },
      });
    });

    return () => disposable?.dispose();
  }, [tables, columnsByTable]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      editorRef.current?.layout();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-full min-h-0 w-full overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        language="sql"
        theme={getMonacoThemeId(themeId)}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{ readOnly }}
        loading={
          <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
            Loading editor...
          </div>
        }
      />
    </div>
  );
});

export default SqlEditor;
