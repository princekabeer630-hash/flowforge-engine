// backend/src/routes/workflowRoutes.ts
import { Router, Response } from 'express';
import { WorkflowModel, DLQModel } from '../models/Workflow';
import { getExecutionOrder, tryParseJSON } from '../utils/executionEngine';
import { runInSandbox } from '../services/sandbox/sandboxService';

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

// GET /api/workflows/dlq - Get all Dead-Letter Queue items for tenant
router.get('/dlq', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';
    const dlqItems = await DLQModel.find({ tenantId }).sort({ failedAt: -1 });
    res.status(200).json({ success: true, dlqItems });
  } catch (err: any) {
    console.error('Error fetching DLQ items:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workflows/analytics/metrics - Retrieve operational metrics & health stats for tenant
router.get('/analytics/metrics', async (req: any, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId || 'default-tenant';

    const totalWorkflows = await WorkflowModel.countDocuments({ tenantId });
    const activeWorkflows = await WorkflowModel.countDocuments({ tenantId, isActive: true });
    const totalDlqErrors = await DLQModel.countDocuments({ tenantId });

    // Determine system health status based on DLQ backlog volume
    let systemHealth = 'Healthy';
    if (totalDlqErrors > 5 && totalDlqErrors <= 15) {
      systemHealth = 'Degraded';
    } else if (totalDlqErrors > 15) {
      systemHealth = 'Critical';
    }

    res.status(200).json({
      success: true,
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalDlqErrors,
        systemHealth,
        quotaLimit: 1000,
        quotaUsed: totalWorkflows * 5
      }
    });
  } catch (err: any) {
    console.error('Error fetching analytics metrics:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workflows/:id/execute - Trigger live streaming execution via Socket.io with Sandbox, Retries, and DLQ
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

    const orderedNodes = getExecutionOrder(workflow.nodes as any, workflow.edges);

    // Stream each step live over WebSockets with sandbox execution, exponential backoff, and DLQ fallback
    for (const node of orderedNodes) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated processing delay

      const customPayload = node.data?.payload ? tryParseJSON(node.data.payload) : {};
      const userScript = node.data?.script;
      
      const maxRetries = node.data?.maxRetries || 3;
      let attempt = 0;
      let success = false;
      let lastError = '';
      let executionOutput: any = {};
      let consoleLogs: string[] = [];

      while (attempt < maxRetries && !success) {
        attempt++;
        try {
          // If the node contains a custom user script, run it in the isolated worker sandbox
          if (userScript && typeof userScript === 'string' && userScript.trim().length > 0) {
            const sandboxRes = await runInSandbox(userScript, customPayload);
            executionOutput.transformedData = sandboxRes.result;
            consoleLogs = sandboxRes.logs;
          }

          const isSimulatedFailure = customPayload.fail === true || customPayload.shouldFail === true;
          if (isSimulatedFailure) {
            throw new Error(`Task failed on attempt ${attempt} (Simulated failure).`);
          }

          success = true;
          if (!userScript) {
            executionOutput = { executedAt: new Date().toISOString(), processedPayload: customPayload };
          }
        } catch (err: any) {
          lastError = err.message;
          console.warn(`⚠️ Node ${node.id} failed on attempt ${attempt}/${maxRetries}. Retrying...`);
          
          if (attempt < maxRetries) {
            const backoffDelay = Math.pow(2, attempt) * 200;
            await new Promise((res) => setTimeout(res, backoffDelay));
          }
        }
      }

      let nodeStatus = success ? 'SUCCESS' : 'FAILED';

      // If all retries exhausted, archive permanently failed task into Dead-Letter Queue (DLQ)
      if (!success) {
        executionOutput = { error: lastError, payload: customPayload, attemptsMade: attempt };

        await DLQModel.create({
          tenantId: workflow.tenantId,
          workflowId: workflow._id,
          nodeId: node.id,
          nodeLabel: node.data?.label || `Node ${node.id}`,
          payload: customPayload,
          error: lastError,
          attemptsMade: attempt
        });

        console.error(`❌ Task Node ${node.id} permanently failed after ${attempt} attempts. Routed to Dead-Letter Queue (DLQ).`);
      }

      const stepResult = {
        nodeId: node.id,
        label: node.data?.label || `Node ${node.id}`,
        status: nodeStatus,
        output: executionOutput,
        logs: consoleLogs,
        attempts: attempt,
        timestamp: new Date().toISOString()
      };

      // Emit live event to all connected socket clients
      req.io.emit('workflow_execution_step', {
        workflowId: workflow._id,
        step: stepResult
      });

      // If a node fails permanently, halt execution stream
      if (!success) {
        req.io.emit('workflow_execution_completed', {
          workflowId: workflow._id,
          message: 'Workflow execution halted due to node failure. Failed task archived in DLQ.'
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