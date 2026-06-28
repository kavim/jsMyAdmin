import { Router, Request, Response } from 'express';
import { connectionManager } from '../db/connection-manager';
import { authMiddleware } from '../middleware/auth';
import z from 'zod';

const router = Router();

router.use(authMiddleware);

const SQL_KEYWORDS_BLOCKLIST = /\b(DROP|INSERT|UPDATE|DELETE|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|GRANT|REVOKE|ATTACH|DETACH|REINDEX|VACUUM)\b/i;
const SQL_COMMENT = /--|\/\*|\*\/|#/;

function sanitizeWhere(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (SQL_KEYWORDS_BLOCKLIST.test(trimmed)) {
    throw new Error('WHERE contains forbidden keywords');
  }
  if (SQL_COMMENT.test(trimmed)) {
    throw new Error('WHERE contains SQL comments');
  }
  if (/['"]/.test(trimmed) && !/^'[^']*'$/.test(trimmed.replace(/[^']/g, ''))) {
    throw new Error('WHERE contains unclosed string literal');
  }
  return trimmed;
}

const ORDERBY_RE = /^[a-zA-Z_`][a-zA-Z0-9_`. ]*( ASC| DESC)?(, [a-zA-Z_`][a-zA-Z0-9_`. ]*( ASC| DESC)?)*$/;

function sanitizeOrderBy(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (SQL_KEYWORDS_BLOCKLIST.test(trimmed)) {
    throw new Error('ORDER BY contains forbidden keywords');
  }
  if (!ORDERBY_RE.test(trimmed)) {
    throw new Error('ORDER BY contains invalid characters');
  }
  return trimmed;
}

const tableDataSchema = z.object({
  database: z.string(),
  table: z.string(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  where: z.string().optional(),
  orderBy: z.string().optional(),
});

router.get('/data', async (req: Request, res: Response) => {
  try {
    const { database, table, page, limit, where, orderBy } = tableDataSchema.parse(req.query);
    const driver = connectionManager.getConnection((req as any).connectionId);

    const tableRef = `\`${table.replace(/`/g, '')}\``;
    let whereClause = '';
    let orderClause = '';

    if (where?.trim()) {
      whereClause = ' WHERE ' + sanitizeWhere(where);
    }

    if (orderBy?.trim()) {
      orderClause = ' ORDER BY ' + sanitizeOrderBy(orderBy);
    }

    const offset = (page - 1) * limit;
    const countSql = 'SELECT COUNT(*) as __cnt FROM ' + tableRef + whereClause;
    const dataSql = 'SELECT * FROM ' + tableRef + whereClause + orderClause + ' LIMIT ' + limit + ' OFFSET ' + offset;

    const countResult = await driver.executeQuery(database, countSql);
    const total = Number(countResult.rows[0]?.__cnt ?? 0);
    const result = await driver.executeQuery(database, dataSql);

    res.json({
      ...result,
      page,
      limit,
      total,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/row', async (req: Request, res: Response) => {
  try {
    const { database, table } = req.query as { database: string; table: string };
    const data = req.body;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    const cols = columns.join(', ');

    const sql = 'INSERT INTO `' + table + '` (' + cols + ') VALUES (' + placeholders + ')';

    const driver = connectionManager.getConnection((req as any).connectionId);
    const result = await driver.executeQuery(database, sql, values);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/row', async (req: Request, res: Response) => {
  try {
    const { database, table } = req.query as { database: string; table: string };
    const data = req.body;

    const driver = connectionManager.getConnection((req as any).connectionId);
    const pk = await (driver as any).getPrimaryKey(database, table);

    const idValue = data[pk];
    if (idValue === undefined) {
      return res.status(400).json({ error: 'Missing primary key value for ' + pk });
    }

    const entries = Object.entries(data).filter(([key]) => key !== pk);
    const setClause = entries.map(([key]) => '`' + key + '` = ?').join(', ');
    const setValues = entries.map(([, value]) => value);

    const sql = 'UPDATE `' + table + '` SET ' + setClause + ' WHERE `' + pk + '` = ?';
    const allValues = [...setValues, idValue];

    const result = await driver.executeQuery(database, sql, allValues);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/row', async (req: Request, res: Response) => {
  try {
    const { database, table } = req.query as { database: string; table: string };
    const data = req.body;

    const driver = connectionManager.getConnection((req as any).connectionId);
    const pk = await (driver as any).getPrimaryKey(database, table);

    const idValue = data[pk];
    if (idValue === undefined) {
      return res.status(400).json({ error: 'Missing primary key value for ' + pk });
    }

    const sql = 'DELETE FROM `' + table + '` WHERE `' + pk + '` = ?';

    const result = await driver.executeQuery(database, sql, [idValue]);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export { router as tableRouter };