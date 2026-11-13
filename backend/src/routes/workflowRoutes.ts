import { Router, Response } from 'express';
import { WorkflowModel } from '../models/Workflow';
import { getExecutionOrder, tryParseJSON } from '../utils/executionEngine';

const router = Router();

// POST /api/workflows - Save a workflow
router.post('/', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const { name, nodes, edges } = req.body;

    if (!name || !nodes || !edges) {
      return res.status(400).json({ error: 'Name, nodes, and edges are required.' });
    }

    const workflow = await WorkflowModel.create({
      tenantId,
      name,
      nodes,
      edges
    });

    res.status(201).json({ message: 'Workflow saved successfully', workflow });
  } catch (err: any) {
    console.error('Error saving workflow:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workflows - Get all workflows for tenant
router.get('/', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const workflows = await WorkflowModel.find({ tenantId });
    res.status(200).json({ workflows });
  } catch (err: any) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/workflows/:id/execute - Trigger live streaming execution via Socket.io
router.post('/:id/execute', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const workflowId = req.params.id;

    const workflow = await WorkflowModel.findOne({ _id: workflowId, tenantId });
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or unauthorized tenant access.' });
    }

    // Send immediate HTTP response acknowledging execution start
    res.status(200).json({
      message: 'Workflow execution started via live stream',
      workflowId: workflow._id,
      workflowName: workflow.name
    });

    const orderedNodes = getExecutionOrder(workflow.nodes, workflow.edges);

    // Stream each step live over WebSockets with failure state support
    for (const node of orderedNodes) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated processing delay

      const customPayload = node.data?.payload ? tryParseJSON(node.data.payload) : {};
      const isSimulatedFailure = customPayload.fail === true || customPayload.shouldFail === true;

      const stepResult = {
        nodeId: node.id,
        label: node.data?.label || `Node ${node.id}`,
        status: isSimulatedFailure ? 'FAILED' : 'SUCCESS',
        output: isSimulatedFailure 
          ? { error: 'Node execution failed', payload: customPayload }
          : { executedAt: new Date().toISOString(), processedPayload: customPayload },
        timestamp: new Date().toISOString()
      };

      // Emit live event to all connected socket clients
      req.io.emit('workflow_execution_step', {
        workflowId: workflow._id,
        step: stepResult
      });

      // If a node fails, halt execution stream
      if (isSimulatedFailure) {
        req.io.emit('workflow_execution_completed', {
          workflowId: workflow._id,
          message: 'Workflow execution halted due to node failure.'
        });
        return;
      }
    }

    // Emit completion event
    req.io.emit('workflow_execution_completed', {
      workflowId: workflow._id,
      message: 'Workflow execution finished successfully'
    });

  } catch (err: any) {
    console.error('Execution stream error:', err);
  }
});

export default router;