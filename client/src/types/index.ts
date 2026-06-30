export type DbType = 'mysql' | 'mariadb' | 'postgresql';

export interface ApiError {
  error: string;
}

export interface HistoryItem {
  sql: string;
  timestamp: number;
  database?: string;
  time?: number;
}

export interface TableSchema {
  name: string;
  engine?: string;
  rows?: number;
  columns: ColumnInfo[];
}

export interface DbCredentials {
  type: DbType;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}

export interface Connection {
  id: string;
  type: DbType;
  host: string;
  database?: string;
}

export interface AuthResponse {
  token: string;
  connection: Connection;
}

export interface TableInfo {
  name: string;
  engine?: string;
  rows?: number;
  dataLength?: number;
  indexLength?: number;
  autoIncrement?: number;
  collate?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  default?: string;
  extra?: string;
  collate?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  affectedRows: number;
  insertId?: number;
  time: number;
}

export interface DatabaseInfo {
  name: string;
  size?: number;
  tables: number;
}

export interface UploadProgress {
  bytes: number;
  total: number;
  percent: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export interface UploadedFile {
  fileId: string;
  filename: string;
  size: number;
  path: string;
  database?: string;
}

export interface QueryBuilderState {
  selectedTables: string[];
  columns: Record<string, string[]>;
  joins: Join[];
  conditions: WhereCondition[];
  orderBy: OrderBy[];
  limit: number;
}

export interface Join {
  table: string;
  column: string;
  refTable: string;
  refColumn: string;
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

export interface WhereCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value: string;
}

export interface OrderBy {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface ScriptNode {
  name: string;
  path: string;
  kind: 'file' | 'folder';
  children?: ScriptNode[];
}

export interface ScriptFile {
  path: string;
  content: string;
  updatedAt: string;
}