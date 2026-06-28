import { Router, Request, Response } from 'express';
import { connectionManager } from '../db/connection-manager';
import { authMiddleware } from '../middleware/auth';
import z from 'zod';

const router = Router();

router.use(authMiddleware);

const querySchema = z.object({
  database: z.string(),
  sql: z.string().min(1),
});

interface HistoryEntry {
  connectionId: string;
  database: string;
  sql: string;
  time: number;
  timestamp: number;
}

class HistoryStore {
  private entries: HistoryEntry[] = [];
  private readonly MAX = 500;
  private readonly filePath: string;

  constructor() {
    const path = require('path');
    const fs = require('fs');
    this.filePath = path.resolve(__dirname, '../../data/query-history.json');
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(this.filePath)) {
      try {
        this.entries = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      } catch {}
    }
  }

  add(entry: HistoryEntry) {
    this.entries.unshift(entry);
    if (this.entries.length > this.MAX) {
      this.entries.length = this.MAX;
    }
    this.flush();
  }

  getAll(connectionId: string, database?: string): HistoryEntry[] {
    return this.entries.filter(
      (h) => h.connectionId === connectionId && (!database || h.database === database)
    ).slice(0, 200);
  }

  clear(connectionId: string, database?: string) {
    this.entries = this.entries.filter(
      (h) => h.connectionId !== connectionId || (database && h.database !== database)
    );
    this.flush();
  }

  private flush() {
    try {
      const fs = require('fs');
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries));
    } catch {}
  }
}

const historyStore = new HistoryStore();

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { database, sql } = querySchema.parse(req.body);
    const connectionId = (req as any).connectionId;
    const driver = connectionManager.getConnection(connectionId);
    const result = await driver.executeQuery(database, sql);

    historyStore.add({
      connectionId,
      database,
      sql,
      time: result.time ?? 0,
      timestamp: Date.now(),
    });

    res.json(result);
  } catch (error: any) {
    console.error('Query error:', error.message);
    res.status(400).json({
      error: error.message,
      sql: req.body.sql?.substring(0, 100),
    });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  const connectionId = (req as any).connectionId;
  const db = req.query.database as string | undefined;
  const history = historyStore.getAll(connectionId, db);
  res.json(history);
});

router.delete('/history', async (req: Request, res: Response) => {
  const connectionId = (req as any).connectionId;
  const db = req.query.database as string | undefined;
  historyStore.clear(connectionId, db);
  res.json({ success: true });
});

const exportSchema = z.object({
  database: z.string(),
  sql: z.string().min(1),
  format: z.enum(['csv', 'json']),
});

router.post('/export', async (req: Request, res: Response) => {
  try {
    const { database, sql, format } = exportSchema.parse(req.body);
    const driver = connectionManager.getConnection((req as any).connectionId);
    const result = await driver.executeQuery(database, sql);

    if (format === 'csv') {
      const header = result.columns.join(',');
      const rows = result.rows.map((row) =>
        result.columns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? '"' + str.replace(/"/g, '""') + '"'
            : str;
        }).join(',')
      );
      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="export.json"');
      res.json(result.rows);
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export { router as queryRouter };