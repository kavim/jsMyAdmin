import { format } from 'sql-formatter';

export function formatSql(sql: string): string {
  try {
    return format(sql, { language: 'sql', tabWidth: 2, keywordCase: 'upper' });
  } catch {
    return sql;
  }
}
