export interface StatementRange {
  start: number;
  end: number;
  text: string;
}

/**
 * Split SQL script into statements by semicolon, respecting strings and comments.
 */
export function splitSqlStatements(sql: string): StatementRange[] {
  const statements: StatementRange[] = [];
  let start = 0;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === '-' && next === '-') {
      i += 2;
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (ch === "'") {
      i++;
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (sql[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '"') {
      i++;
      while (i < sql.length) {
        if (sql[i] === '"' && sql[i + 1] === '"') {
          i += 2;
          continue;
        }
        if (sql[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    if (ch === '`') {
      i++;
      while (i < sql.length && sql[i] !== '`') i++;
      i++;
      continue;
    }

    if (ch === ';') {
      pushStatement(sql, start, i, statements);
      start = i + 1;
      i++;
      continue;
    }

    i++;
  }

  pushStatement(sql, start, sql.length, statements);
  return statements;
}

function pushStatement(
  sql: string,
  start: number,
  end: number,
  statements: StatementRange[]
): void {
  const text = sql.slice(start, end).trim();
  if (!text) return;
  statements.push({ start, end, text });
}

/**
 * Convert 1-based line/column (Monaco) to byte offset in sql string.
 */
export function positionToOffset(sql: string, line: number, column: number): number {
  const lines = sql.split('\n');
  let offset = 0;

  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }

  const currentLine = lines[line - 1] ?? '';
  return offset + Math.min(column - 1, currentLine.length);
}

/**
 * Return the statement text at the given offset, or null if none.
 * If offset falls in whitespace between statements, returns the previous non-empty statement.
 */
export function getStatementKey(range: StatementRange): string {
  return `${range.start}:${range.end}`;
}

/**
 * Return the statement range that contains the given 1-based line number.
 */
export function getStatementRangeAtLine(sql: string, lineNumber: number): StatementRange | null {
  const offset = positionToOffset(sql, lineNumber, 1);
  return getStatementRangeAtOffset(sql, offset);
}

export function getStatementAtOffset(sql: string, offset: number): string | null {
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) return null;

  const clamped = Math.max(0, Math.min(offset, sql.length));

  for (const stmt of statements) {
    if (clamped >= stmt.start && clamped <= stmt.end) {
      return stmt.text;
    }
  }

  let previous: StatementRange | null = null;
  for (const stmt of statements) {
    if (clamped < stmt.start) {
      return previous?.text ?? statements[0].text;
    }
    previous = stmt;
  }

  return previous?.text ?? statements[statements.length - 1].text;
}

/**
 * Return the range of the statement at the given offset (for editor highlighting).
 */
export function getStatementRangeAtOffset(
  sql: string,
  offset: number
): StatementRange | null {
  const statements = splitSqlStatements(sql);
  if (statements.length === 0) return null;

  const clamped = Math.max(0, Math.min(offset, sql.length));

  for (const stmt of statements) {
    if (clamped >= stmt.start && clamped <= stmt.end) {
      return stmt;
    }
  }

  let previous: StatementRange | null = null;
  for (const stmt of statements) {
    if (clamped < stmt.start) {
      return previous ?? statements[0];
    }
    previous = stmt;
  }

  return previous ?? statements[statements.length - 1];
}

/**
 * Convert byte offset to 1-based line/column (Monaco).
 */
export function offsetToPosition(sql: string, offset: number): { line: number; column: number } {
  let line = 1;
  let column = 1;
  const clamped = Math.max(0, Math.min(offset, sql.length));

  for (let i = 0; i < clamped; i++) {
    if (sql[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}
