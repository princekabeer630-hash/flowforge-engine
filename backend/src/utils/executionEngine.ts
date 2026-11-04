// backend/src/utils/executionEngine.ts

export interface WorkflowNode {
  id: string;
  data: { label: string; [key: string]: any };
  type?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface ExecutionStepResult {
  nodeId: string;
  label: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  output?: any;
  timestamp: string;
}

// Topological sort to order DAG nodes for sequential execution
export function getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    adjList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (adjList.has(edge.source)) {
      adjList.get(edge.source)!.push(edge.target);
    }
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sortedNodeIds: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedNodeIds.push(curr);

    const neighbors = adjList.get(curr) || [];
    neighbors.forEach((neighbor) => {
      inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
}

// Run the state-machine workflow simulator
export async function executeWorkflowState(nodes: WorkflowNode[], edges: WorkflowEdge[]): Promise<ExecutionStepResult[]> {
  const orderedNodes = getExecutionOrder(nodes, edges);
  const executionTrace: ExecutionStepResult[] = [];

  for (const node of orderedNodes) {
    const stepResult: ExecutionStepResult = {
      nodeId: node.id,
      label: node.data?.label || `Node ${node.id}`,
      status: 'SUCCESS',
      output: { executedAt: new Date().toISOString(), payloadProcessed: true },
      timestamp: new Date().toISOString()
    };

    executionTrace.push(stepResult);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return executionTrace;
}