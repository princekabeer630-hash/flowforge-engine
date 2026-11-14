import crypto from 'crypto';
if (!globalThis.crypto) {
  (globalThis as any).crypto = crypto;
}

import { initWorkflowChangeStream } from './services/changeStreamService';
import express, { Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { tenantContextMiddleware } from './middlewares/tenantContext';
import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflowRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io once with CORS enabled for frontend communication
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize MongoDB Change Stream watcher
initWorkflowChangeStream(io);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flowforge';

app.use(helmet());
app.use(cors());
app.use(express.json());

// Attach Socket.io instance to request object so route handlers can emit live events
app.use((req: any, res: Response, next: Function) => {
  req.io = io;
  next();
});

// 1. Mount Public Authentication Routes
app.use('/api/auth', authRoutes);

// 2. Apply tenant context security middleware globally to API routes
app.use('/api', tenantContextMiddleware);

// 3. Mount Protected Workflow Routes (Handles workflow saving and live execution)
app.use('/api/workflows', workflowRoutes);

// Socket.io connection listener
io.on('connection', (socket) => {
  console.log(`⚡ Client connected via WebSocket: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Database connection & Server start using HTTP server instead of express app.listen
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server & WebSocket running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });