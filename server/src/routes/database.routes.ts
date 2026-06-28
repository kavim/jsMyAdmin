import { Router, Request, Response } from 'express';
import { connectionManager } from '../db/connection-manager';
import { AppError } from '../middleware/error-handler';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response) => {
  try {
    const driver = connectionManager.getConnection((req as any).connectionId);
    const databases = await driver.listDatabases();
    res.json(databases);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

router.get('/:database/tables', async (req: Request, res: Response) => {
  try {
    const { database } = req.params;
    const driver = connectionManager.getConnection((req as any).connectionId);
    const tables = await driver.listTables(database);
    res.json(tables);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

router.get('/:database/tables/:table/columns', async (req: Request, res: Response) => {
  try {
    const { database, table } = req.params;
    const driver = connectionManager.getConnection((req as any).connectionId);
    const columns = await driver.getTableColumns(database, table);
    res.json(columns);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

router.get('/:database/schema', async (req: Request, res: Response) => {
  try {
    const { database } = req.params;
    const driver = connectionManager.getConnection((req as any).connectionId);
    const tables = await driver.listTables(database);
    const schema = await Promise.all(
      tables.map(async (table) => ({
        ...table,
        columns: await driver.getTableColumns(database, table.name),
      }))
    );
    res.json(schema);
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export { router as databaseRouter };