import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import coupleRoutes from './routes/couple.js';
import syncRoutes from './routes/sync.js';
import { handleConnection } from './sockets/syncHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// 静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

import { authenticate } from './middleware/auth.js';

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/couple', authenticate, coupleRoutes);
app.use('/api/couple', authenticate, syncRoutes); // mount sync under /api/couple/:coupleId/sync

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io 中间件：认证
io.use(async (socket, next) => {
  const { auth } = socket.handshake;

  if (!auth?.token) {
    return next(new Error('Authentication required'));
  }

  try {
    const { verifyAccessToken } = await import('./services/tokenService.js');
    const payload = verifyAccessToken(auth.token);

    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.userId = payload.sub;
    socket.coupleId = payload.coupleId;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', handleConnection);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready on :${PORT}`);
});
