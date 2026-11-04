import express, { Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { tenantContextMiddleware } from './middlewares/tenantContext';
import authRoutes from './routes/authRoutes';
import workflowRoutes from './routes/workflowRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flowforge';

app.use(helmet());
app.use(cors());
app.use(express.json());

// 1. Mount Public Authentication Routes (Bypasses tenant check if needed, or place below tenant middleware depending on your auth design)
app.use('/api/auth', authRoutes);

// 2. Apply tenant context security middleware globally to API routes
app.use('/api', tenantContextMiddleware);

// 3. Mount Protected Workflow Routes (Handles both workflow saving and execution)
app.use('/api/workflows', workflowRoutes);

// Database connection & Server start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });