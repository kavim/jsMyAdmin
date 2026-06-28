import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { app } from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './socket/socket-handler';
import cors from 'cors';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.set('io', io);
setupSocketHandlers(io);

const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('Serving client build from:', clientDist);
} else {
  console.log('Client dist not found at', clientDist, '- skipping static serving');
}

httpServer.listen(PORT, () => {
  console.log(`🚀 JSMYADMIN Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});

export { io };