import { Request } from 'express';
import { DbCredentials } from './types/database';

declare global {
  namespace Express {
    interface Request {
      connectionId?: string;
      dbCredentials?: DbCredentials;
    }
  }
}

export {};