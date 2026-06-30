import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

const router = Router();

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || path.join(DATA_DIR, 'scripts');

if (!fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
}

export interface ScriptNode {
  name: string;
  path: string;
  kind: 'file' | 'folder';
  children?: ScriptNode[];
}

function resolveSafePath(relativePath: string): string {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const resolved = path.resolve(SCRIPTS_DIR, normalized);
  if (!resolved.startsWith(path.resolve(SCRIPTS_DIR))) {
    throw new AppError('Invalid path', 400);
  }
  return resolved;
}

function validateName(name: string): void {
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new AppError('Invalid name', 400);
  }
  if (!/^[a-zA-Z0-9_\-. ]+$/.test(name)) {
    throw new AppError('Name contains invalid characters', 400);
  }
}

function validateFilePath(relativePath: string): void {
  if (!relativePath.endsWith('.sql')) {
    throw new AppError('Only .sql files are allowed', 400);
  }
  const base = path.basename(relativePath);
  validateName(base);
}

function buildTree(dir: string, relative = ''): ScriptNode[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: ScriptNode[] = [];

  for (const entry of entries) {
    const entryRel = relative ? `${relative}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: entryRel.replace(/\\/g, '/'),
        kind: 'folder',
        children: buildTree(path.join(dir, entry.name), entryRel),
      });
    } else if (entry.isFile() && entry.name.endsWith('.sql')) {
      nodes.push({
        name: entry.name,
        path: entryRel.replace(/\\/g, '/'),
        kind: 'file',
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

router.use(authMiddleware);

router.get('/', (_req: Request, res: Response) => {
  const tree = buildTree(SCRIPTS_DIR);
  res.json(tree);
});

router.get('/file', (req: Request, res: Response, next: NextFunction) => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) throw new AppError('path is required', 400);

    validateFilePath(relativePath);
    const fullPath = resolveSafePath(relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new AppError('File not found', 404);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const stat = fs.statSync(fullPath);

    res.json({
      path: relativePath.replace(/\\/g, '/'),
      content,
      updatedAt: stat.mtime.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/file', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: relativePath, content } = req.body as { path?: string; content?: string };
    if (!relativePath) throw new AppError('path is required', 400);
    if (typeof content !== 'string') throw new AppError('content is required', 400);

    validateFilePath(relativePath);
    const fullPath = resolveSafePath(relativePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    const stat = fs.statSync(fullPath);

    res.json({
      path: relativePath.replace(/\\/g, '/'),
      updatedAt: stat.mtime.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/folder', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: relativePath } = req.body as { path?: string };
    if (!relativePath) throw new AppError('path is required', 400);

    const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
    for (const seg of segments) validateName(seg);

    const fullPath = resolveSafePath(relativePath);

    if (fs.existsSync(fullPath)) {
      throw new AppError('Folder already exists', 409);
    }

    fs.mkdirSync(fullPath, { recursive: true });

    res.json({ path: relativePath.replace(/\\/g, '/') });
  } catch (err) {
    next(err);
  }
});

router.delete('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) throw new AppError('path is required', 400);

    const fullPath = resolveSafePath(relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new AppError('Not found', 404);
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true });
    } else {
      if (!relativePath.endsWith('.sql')) {
        throw new AppError('Only .sql files can be deleted', 400);
      }
      fs.unlinkSync(fullPath);
    }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

export const scriptsRouter = router;
