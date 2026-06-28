import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';

export function setupSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyToken(token);
      (socket as any).connectionId = decoded.connectionId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('upload:start', (data: { fileId: string; dbName: string }) => {
      console.log(`📤 Upload started: ${data.fileId} to ${data.dbName}`);
      socket.emit('upload:progress', { fileId: data.fileId, percent: 0 });
    });

    socket.on('import:start', async (data: { fileId: string; database: string }) => {
      console.log(`📥 Import started: ${data.fileId} to ${data.database}`);
      socket.emit('import:progress', { fileId: data.fileId, percent: 0 });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  io.of('/upload').on('connection', (socket: Socket) => {
    socket.on('progress', (data: { fileId: string; percent: number; bytes: number }) => {
      socket.broadcast.emit('progress', data);
    });
  });

  console.log('✅ Socket handlers initialized');
}