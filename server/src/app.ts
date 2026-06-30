import express, { Express, Request, Response, NextFunction } from 'express';
import { authRouter } from './routes/auth.routes';
import { databaseRouter } from './routes/database.routes';
import { queryRouter } from './routes/query.routes';
import { tableRouter } from './routes/table.routes';
import { uploadRouter } from './routes/upload.routes';
import { scriptsRouter } from './routes/scripts.routes';
import { errorHandler } from './middleware/error-handler';

export const app: Express = express();

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/databases', databaseRouter);
app.use('/api/query', queryRouter);
app.use('/api/tables', tableRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/scripts', scriptsRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);