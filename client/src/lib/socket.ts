import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitUploadStart(fileId: string, dbName: string) {
  getSocket().emit('upload:start', { fileId, dbName });
}

export function emitImportStart(fileId: string, database: string) {
  getSocket().emit('import:start', { fileId, database });
}

export function onUploadProgress(callback: (data: { fileId: string; percent: number }) => void) {
  const s = getSocket();
  s.on('upload:progress', callback);
  return () => {
    s.off('upload:progress', callback);
  };
}

export function onImportProgress(
  callback: (data: { fileId: string; percent: number; statement?: number; total?: number }) => void
) {
  const s = getSocket();
  s.on('import:progress', callback);
  return () => {
    s.off('import:progress', callback);
  };
}
