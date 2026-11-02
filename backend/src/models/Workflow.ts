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