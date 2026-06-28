import { DbCredentials, DbType, DbConnection, QueryResult, TableInfo, ColumnInfo, DatabaseInfo } from '../types/database';
import { AppError } from '../middleware/error-handler';
import { v4 as uuidv4 } from 'uuid';

interface DbDriver {
  connect(credentials: DbCredentials): Promise<void>;
  disconnect(): Promise<void>;
  listDatabases(): Promise<DatabaseInfo[]>;
  listTables(database: string): Promise<TableInfo[]>;
  getTableColumns(database: string, table: string): Promise<ColumnInfo[]>;
  executeQuery(database: string, sql: string, params?: any[]): Promise<QueryResult>;
  importDump(database: string, filePath: string, onProgress?: (bytes: number, total: number) => void): Promise<void>;
  getPrimaryKey?(database: string, table: string): Promise<string>;
}

class MySqlDriver implements DbDriver {
  private pool: any = null;

  async connect(credentials: DbCredentials): Promise<void> {
    const mysql = await import('mysql2/promise');
    this.pool = mysql.createPool({
      host: credentials.host,
      port: credentials.port,
      user: credentials.username,
      password: credentials.password,
      database: credentials.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: undefined,
    });
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<DatabaseInfo[]> {
    const [rows] = await this.pool.query('SHOW DATABASES');
    return (rows as any[]).map((r: any) => ({ name: r.Database, tables: 0 }));
  }

  async listTables(database: string): Promise<TableInfo[]> {
    await this.pool.query(`USE \`${database}\``);
    const [rows] = await this.pool.query('SHOW TABLE STATUS');
    return (rows as any[]).map((r: any) => ({
      name: r.Name,
      engine: r.Engine,
      rows: r.Rows,
      dataLength: r.Data_length,
      indexLength: r.Index_length,
      autoIncrement: r.Auto_increment,
    }));
  }

  async getTableColumns(database: string, table: string): Promise<ColumnInfo[]> {
    const [rows] = await this.pool.query(`SHOW FULL COLUMNS FROM \`${table}\` FROM \`${database}\``);
    return (rows as any[]).map((r: any) => ({
      name: r.Field,
      type: r.Type,
      nullable: r.Null === 'YES',
      key: r.Key,
      default: r.Default,
      extra: r.Extra,
      collate: r.Collation,
    }));
  }

  async executeQuery(database: string, sql: string, params?: any[]): Promise<QueryResult> {
    await this.pool.query(`USE \`${database}\``);
    const start = Date.now();
    const [results, fields] = params
      ? await this.pool.query(sql, params)
      : await this.pool.query(sql);
    const columns = fields ? (fields as any[]).map((f: any) => f.name) : [];
    const rows = Array.isArray(results) ? results : [results];
    return {
      columns,
      rows: rows as Record<string, unknown>[],
      affectedRows: (results as any).affectedRows || rows.length,
      insertId: (results as any).insertId,
      time: Date.now() - start,
    };
  }

  async getPrimaryKey(database: string, table: string): Promise<string> {
    const sql = "SHOW KEYS FROM `" + table + "` FROM `" + database + "` WHERE Key_name = 'PRIMARY'";
    const [rows] = await this.pool.query(sql);
    const keys = rows as any[];
    return keys.length > 0 ? keys[0].Column_name : 'id';
  }

  async importDump(database: string, filePath: string, onProgress?: (bytes: number, total: number) => void): Promise<void> {
    const fs = await import('fs');
    const readline = await import('readline');
    const zlib = await import('zlib');

    await this.pool.query(`USE \`${database}\``);
    await this.pool.query('SET autocommit=0');

    const rawStream = fs.createReadStream(filePath);
    const stream = filePath.endsWith('.gz')
      ? rawStream.pipe(zlib.createGunzip())
      : rawStream;

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let sql = '';
    let processedBytes = 0;
    const totalBytes = fs.statSync(filePath).size;
    let errors = 0;

    for await (const line of rl) {
      processedBytes += Buffer.byteLength(line, 'utf8') + 1;
      sql += line + '\n';

      if (sql.trim().endsWith(';')) {
        const trimmed = sql.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('#')) {
          try {
            await this.pool.query(sql);
          } catch (e) {
            errors++;
            console.error('SQL Error at line ~' + Math.round(processedBytes / 100) + ':', sql.substring(0, 120), e);
          }
        }
        sql = '';
        if (onProgress) onProgress(Math.min(processedBytes, totalBytes), totalBytes);
      }
    }

    if (sql.trim()) {
      try {
        await this.pool.query(sql);
      } catch (e) {
        errors++;
        console.error('SQL Error (final):', sql.substring(0, 120), e);
      }
    }

    await this.pool.query('COMMIT');
    await this.pool.query('SET autocommit=1');

    if (onProgress) onProgress(totalBytes, totalBytes);

    if (errors > 0) {
      console.warn('Import completed with ' + errors + ' error(s)');
    }
  }
}

class MariaDbDriver implements DbDriver {
  private pool: any = null;

  async connect(credentials: DbCredentials): Promise<void> {
    const mariadb = await import('mariadb');
    this.pool = mariadb.createPool({
      host: credentials.host,
      port: credentials.port,
      user: credentials.username,
      password: credentials.password,
      database: credentials.database,
      connectionLimit: 10,
    });
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<DatabaseInfo[]> {
    const rows = await this.pool.query('SHOW DATABASES');
    return rows.map((r: any) => ({ name: r.Database, tables: 0 }));
  }

  async listTables(database: string): Promise<TableInfo[]> {
    await this.pool.query(`USE \`${database}\``);
    const rows = await this.pool.query('SHOW TABLE STATUS');
    return rows.map((r: any) => ({
      name: r.Name,
      engine: r.Engine,
      rows: r.Rows,
      dataLength: r.Data_length,
      indexLength: r.Index_length,
      autoIncrement: r.Auto_increment,
    }));
  }

  async getTableColumns(database: string, table: string): Promise<ColumnInfo[]> {
    const rows = await this.pool.query(`SHOW FULL COLUMNS FROM \`${table}\` FROM \`${database}\``);
    return rows.map((r: any) => ({
      name: r.Field,
      type: r.Type,
      nullable: r.Null === 'YES',
      key: r.Key,
      default: r.Default,
      extra: r.Extra,
      collate: r.Collation,
    }));
  }

  async executeQuery(database: string, sql: string, params?: any[]): Promise<QueryResult> {
    await this.pool.query(`USE \`${database}\``);
    const start = Date.now();
    const results = params
      ? await this.pool.query(sql, params)
      : await this.pool.query(sql);
    const rows = Array.isArray(results) ? results : [results];
    const firstRow = rows[0] as any || {};
    return {
      columns: Object.keys(firstRow),
      rows: rows as Record<string, unknown>[],
      affectedRows: rows.length,
      insertId: (results as any).insertId,
      time: Date.now() - start,
    };
  }

  async getPrimaryKey(database: string, table: string): Promise<string> {
    const results = await this.pool.query("SHOW KEYS FROM `" + table + "` FROM `" + database + "` WHERE Key_name = 'PRIMARY'");
    const keys = Array.isArray(results) ? results : [results];
    return keys.length > 0 ? keys[0].Column_name : 'id';
  }

  async importDump(database: string, filePath: string, onProgress?: (bytes: number, total: number) => void): Promise<void> {
    const fs = await import('fs');
    const readline = await import('readline');
    const zlib = await import('zlib');

    await this.pool.query(`USE \`${database}\``);
    await this.pool.query('SET autocommit=0');

    const rawStream = fs.createReadStream(filePath);
    const stream = filePath.endsWith('.gz')
      ? rawStream.pipe(zlib.createGunzip())
      : rawStream;

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let sql = '';
    let processedBytes = 0;
    const totalBytes = fs.statSync(filePath).size;
    let errors = 0;

    for await (const line of rl) {
      processedBytes += Buffer.byteLength(line, 'utf8') + 1;
      sql += line + '\n';

      if (sql.trim().endsWith(';')) {
        const trimmed = sql.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('#')) {
          try {
            await this.pool.query(sql);
          } catch (e) {
            errors++;
            console.error('SQL Error at ~byte ' + processedBytes + ':', sql.substring(0, 120), e);
          }
        }
        sql = '';
        if (onProgress) onProgress(Math.min(processedBytes, totalBytes), totalBytes);
      }
    }

    if (sql.trim()) {
      try {
        await this.pool.query(sql);
      } catch (e) {
        errors++;
        console.error('SQL Error (final):', sql.substring(0, 120), e);
      }
    }

    await this.pool.query('COMMIT');
    await this.pool.query('SET autocommit=1');

    if (onProgress) onProgress(totalBytes, totalBytes);

    if (errors > 0) {
      console.warn('Import completed with ' + errors + ' error(s)');
    }
  }
}

class PostgresDriver implements DbDriver {
  private client: any = null;

  async connect(credentials: DbCredentials): Promise<void> {
    const { Pool } = await import('pg');
    this.client = new Pool({
      host: credentials.host,
      port: credentials.port,
      user: credentials.username,
      password: credentials.password,
      database: credentials.database,
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }

  async listDatabases(): Promise<DatabaseInfo[]> {
    const res = await this.client.query("SELECT datname as name FROM pg_database WHERE datistemplate = false");
    return res.rows.map((r: any) => ({ name: r.name, tables: 0 }));
  }

  async listTables(database: string): Promise<TableInfo[]> {
    const res = await this.client.query(`
      SELECT tablename as name 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    return res.rows.map((r: any) => ({ name: r.name }));
  }

  async getTableColumns(database: string, table: string): Promise<ColumnInfo[]> {
    const res = await this.client.query(`
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable as nullable,
        column_default as "default"
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table]);
    return res.rows.map((r: any) => ({
      name: r.name,
      type: r.type,
      nullable: r.nullable === 'YES',
      key: '',
      default: r.default,
    }));
  }

  async executeQuery(database: string, sql: string, params?: any[]): Promise<QueryResult> {
    const start = Date.now();
    const pgSql = params ? sql.replace(/\?/g, () => '$' + (params.length > 0 ? params.indexOf(params.shift()!) + 1 : 1)) : sql;
    const res = params
      ? await this.client.query(pgSql, params)
      : await this.client.query(sql);
    const columns = res.fields ? res.fields.map((f: any) => f.name) : [];
    return {
      columns,
      rows: res.rows as Record<string, unknown>[],
      affectedRows: res.rowCount || 0,
      insertId: undefined,
      time: Date.now() - start,
    };
  }

  async getPrimaryKey(database: string, table: string): Promise<string> {
    const res = await this.client.query(
      "SELECT a.attname AS column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary",
      [table]
    );
    return res.rows.length > 0 ? res.rows[0].column_name : 'id';
  }

  async importDump(database: string, filePath: string, onProgress?: (bytes: number, total: number) => void): Promise<void> {
    const fs = await import('fs');
    const readline = await import('readline');
    const zlib = await import('zlib');

    await this.client.query('BEGIN');

    const rawStream = fs.createReadStream(filePath);
    const stream = filePath.endsWith('.gz')
      ? rawStream.pipe(zlib.createGunzip())
      : rawStream;

    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let sql = '';
    let processedBytes = 0;
    const totalBytes = fs.statSync(filePath).size;
    let errors = 0;

    for await (const line of rl) {
      processedBytes += Buffer.byteLength(line, 'utf8') + 1;
      sql += line + '\n';

      if (sql.trim().endsWith(';')) {
        const trimmed = sql.trim();
        if (trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('#')) {
          try {
            await this.client.query(sql);
          } catch (e) {
            errors++;
            console.error('SQL Error at ~byte ' + processedBytes + ':', sql.substring(0, 120), e);
          }
        }
        sql = '';
        if (onProgress) onProgress(Math.min(processedBytes, totalBytes), totalBytes);
      }
    }

    if (sql.trim()) {
      try {
        await this.client.query(sql);
      } catch (e) {
        errors++;
        console.error('SQL Error (final):', sql.substring(0, 120), e);
      }
    }

    await this.client.query('COMMIT');

    if (onProgress) onProgress(totalBytes, totalBytes);

    if (errors > 0) {
      console.warn('Import completed with ' + errors + ' error(s)');
    }
  }
}

class ConnectionManager {
  private connections = new Map<string, { driver: DbDriver; credentials: DbCredentials }>();
  private readonly MAX_CONNECTIONS = 50;

  async createConnection(credentials: DbCredentials): Promise<string> {
    if (this.connections.size >= this.MAX_CONNECTIONS) {
      throw new Error('Maximum connections reached (' + this.MAX_CONNECTIONS + ')');
    }
    const id = uuidv4();
    let driver: DbDriver;

    switch (credentials.type) {
      case 'mysql':
        driver = new MySqlDriver();
        break;
      case 'mariadb':
        driver = new MariaDbDriver();
        break;
      case 'postgresql':
        driver = new PostgresDriver();
        break;
      default:
        throw new Error(`Unsupported database type: ${credentials.type}`);
    }

    await driver.connect(credentials);
    this.connections.set(id, { driver, credentials });

    return id;
  }

  getConnection(id: string) {
    const conn = this.connections.get(id);
    if (!conn) throw new AppError('Session expired', 401);
    return conn.driver;
  }

  async closeConnection(id: string): Promise<void> {
    const conn = this.connections.get(id);
    if (conn) {
      await conn.driver.disconnect();
      this.connections.delete(id);
    }
  }

  closeAll(): void {
    this.connections.clear();
  }
}

export const connectionManager = new ConnectionManager();