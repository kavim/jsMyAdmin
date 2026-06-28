import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('WARN: JWT_SECRET not set. Using insecure default. Set JWT_SECRET env var in production.');
    return 'jsmyadmin-dev-secret-change-in-production';
  }
  return secret;
})();

export interface AuthPayload {
  connectionId: string;
  type: string;
  host: string;
  username: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).connectionId = decoded.connectionId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function createToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}