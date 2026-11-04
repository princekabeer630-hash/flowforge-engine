// backend/src/routes/workflowRoutes.ts
import { Router, Response } from 'express';
import { WorkflowModel } from '../models/Workflow'; // Import WorkflowModel correctly matching your model file

const router = Router();

// POST /api/workflows - Save a workflow
router.post('/', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const { name, nodes, edges } = req.body;

    const newWorkflow = new WorkflowModel({
      tenantId,
      name,
      nodes,
      edges,
    });

    const savedWorkflow = await newWorkflow.save();

    return res.status(201).json({ message: 'Workflow saved successfully', workflow: savedWorkflow });
  } catch (err: any) {
    console.error('Error saving workflow:', err);
    return res.status(500).json({ error: err.message || 'Server error while saving workflow' });
  }
});

// POST /api/workflows/:id/execute - Trigger state-machine workflow execution
router.post('/:id/execute', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const workflowId = req.params.id;

    const workflow = await WorkflowModel.findOne({ _id: workflowId, tenantId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or unauthorized tenant access.' });
    }

    const { executeWorkflowState } = await import('../utils/executionEngine');
    const executionTrace = await executeWorkflowState(workflow.nodes, workflow.edges);

    return res.status(200).json({
      message: 'Workflow executed successfully via state-machine runner',
      workflowId: workflow._id,
      workflowName: workflow.name,
      totalSteps: executionTrace.length,
      trace: executionTrace
    });
  } catch (err: any) {
    console.error('Execution error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during workflow execution.' });
  }
});

export default router;