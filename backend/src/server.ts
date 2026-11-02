import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { tenantContextMiddleware, TenantRequest } from './middlewares/tenantContext';
import { WorkflowModel } from './models/Workflow';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/flowforge';

app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply tenant context security middleware globally to API routes
app.use('/api', tenantContextMiddleware);

// Example workflow creation route leveraging tenant context isolation
app.post('/api/workflows', async (req: TenantRequest, res: Response) => {
  try {
    const { name, nodes, edges } = req.body;
    const workflow = new WorkflowModel({
      tenantId: req.tenantId, // Isolated securely via tenant context middleware
      name,
      nodes,
      edges
    });
    const savedWorkflow = await workflow.save();
    res.status(201).json({ success: true, data: savedWorkflow });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`FlowForge backend execution server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });