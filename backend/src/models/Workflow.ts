import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface IWorkflow extends Document {
  tenantId: string;
  name: string;
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema: Schema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    nodes: { type: Array, required: true, default: [] },
    edges: { type: Array, required: true, default: [] },
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Enforce compound index for high-performance multi-tenant lookup isolation
WorkflowSchema.index({ tenantId: 1, name: 1 });

export const WorkflowModel = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);

// Dead-Letter Queue (DLQ) Schema for permanently failed tasks after retries
const DLQSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    nodeId: { type: String, required: true },
    nodeLabel: { type: String },
    payload: { type: Object },
    error: { type: String, required: true },
    attemptsMade: { type: Number, required: true },
    failedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

DLQSchema.index({ tenantId: 1, workflowId: 1 });

export const DLQModel = mongoose.model('DeadLetterQueue', DLQSchema);