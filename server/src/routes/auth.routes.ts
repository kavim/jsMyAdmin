import { Router, Request, Response } from 'express';
import { connectionManager } from '../db/connection-manager';
import { AppError } from '../middleware/error-handler';
import { authMiddleware, createToken } from '../middleware/auth';
import z from 'zod';

const router = Router();

const loginSchema = z.object({
  type: z.enum(['mysql', 'mariadb', 'postgresql']),
  host: z.string().default('localhost'),
  port: z.number().default(3306),
  username: z.string(),
  password: z.string(),
  database: z.string().optional(),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const credentials = loginSchema.parse(req.body);

    const connectionId = await connectionManager.createConnection(credentials);

    const token = createToken({
      connectionId,
      type: credentials.type,
      host: credentials.host,
      username: credentials.username,
    });

    res.json({
      token,
      connection: {
        id: connectionId,
        type: credentials.type,
        host: credentials.host,
        database: credentials.database,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(401).json({
      error: error.message || 'Connection failed',
    });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const connectionId = (req as any).connectionId;
    if (connectionId) {
      await connectionManager.closeConnection(connectionId);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const connectionId = (req as any).connectionId;
    const driver = connectionManager.getConnection(connectionId);
    await driver.listDatabases();
    res.json({ valid: true });
  } catch (error: unknown) {
    const message = error instanceof AppError ? error.message : 'Invalid session';
    const status = error instanceof AppError ? error.statusCode : 401;
    res.status(status).json({ error: message });
  }
});

export { router as authRouter };