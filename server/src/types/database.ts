export type DbType = 'mysql' | 'mariadb' | 'postgresql';

export interface DbCredentials {
  type: DbType;
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}

export interface DbConnection {
  id: string;
  credentials: DbCredentials;
  connected: boolean;
  createdAt: Date;
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