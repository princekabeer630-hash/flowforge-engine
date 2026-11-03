import { Node, Edge } from 'reactflow';

export class DAGValidator {
  // Detects cycles (loops) in the workflow graph using Depth-First Search (DFS)
  static hasCyclicDependency(nodes: Node[], edges: Edge[]): boolean {
    const adjList = new Map<string, string[]>();

    nodes.forEach((node) => adjList.set(node.id, []));
    edges.forEach((edge) => {
      if (adjList.has(edge.source)) {
        adjList.get(edge.source)?.push(edge.target);
      }
    });

    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visiting.add(nodeId);
      const neighbors = adjList.get(nodeId) || [];

      for (const neighbor of neighbors) {
        if (visiting.has(neighbor)) return true; // Cycle detected!
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }
}