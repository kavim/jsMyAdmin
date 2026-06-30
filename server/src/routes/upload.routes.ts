import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { connectionManager } from '../db/connection-manager';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const PROGRESS_FILE = path.join(DATA_DIR, 'upload-progress.json');

interface ProgressEntry {
  bytes: number;
  total: number;
  percent: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

function loadProgress(): Record<string, ProgressEntry> {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveProgress(data: Record<string, ProgressEntry>) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data));
  } catch {}
}

// Cleanup orphaned files on startup
const progress = loadProgress();
for (const [fileId, entry] of Object.entries(progress)) {
  if (entry.status === 'processing' || entry.status === 'uploading') {
    const file = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(fileId));
    if (file) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, file)); } catch {}
    }
    delete progress[fileId];
  }
}
saveProgress(progress);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024,
  },
});

router.use(authMiddleware);

let uploadProgress = new Map<string, ProgressEntry>(Object.entries(loadProgress()));

function persistProgress() {
  saveProgress(Object.fromEntries(uploadProgress));
}

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { database } = req.body;
    const fileId = req.file.filename.split('-')[0];

    uploadProgress.set(fileId, {
      bytes: req.file.size,
      total: req.file.size,
      percent: 100,
      status: 'complete',
    });
    persistProgress();

    res.json({
      fileId,
      filename: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
      database,
    });
  } catch (error: any) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/progress/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const progress = uploadProgress.get(fileId);

  if (!progress) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.json(progress);
});

router.post('/import', async (req: Request, res: Response) => {
  const { fileId, database } = req.body;
  let filePath: string | null = null;

  try {
    const file = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(fileId));
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    filePath = path.join(UPLOAD_DIR, file);
    const totalBytes = fs.statSync(filePath).size;

    uploadProgress.set(fileId, {
      bytes: 0,
      total: totalBytes,
      percent: 0,
      status: 'processing',
    });
    persistProgress();

    const driver = connectionManager.getConnection((req as any).connectionId);
    const io = req.app.get('io');

    if (io) {
      io.emit('import:progress', { fileId, percent: 0, bytes: 0, total: totalBytes });
    }

    await driver.importDump(database, filePath, (bytes, total) => {
      const percent = Math.min(Math.round((bytes / total) * 100), 100);
      uploadProgress.set(fileId, {
        bytes,
        total,
        percent,
        status: 'processing',
      });
      if (io) {
        io.emit('import:progress', { fileId, percent, bytes, total });
      }
    });

    uploadProgress.set(fileId, {
      bytes: totalBytes,
      total: totalBytes,
      percent: 100,
      status: 'complete',
    });
    persistProgress();

    fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Import error:', error.message);
    uploadProgress.set(fileId, {
      bytes: 0,
      total: 0,
      percent: 0,
      status: 'error',
    });
    persistProgress();
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = fs.readdirSync(UPLOAD_DIR).find(f => f.startsWith(fileId));

    if (file) {
      fs.unlinkSync(path.join(UPLOAD_DIR, file));
    }

    uploadProgress.delete(fileId);
    persistProgress();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as uploadRouter, uploadProgress };