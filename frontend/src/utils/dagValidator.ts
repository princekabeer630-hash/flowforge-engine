// frontend/src/utils/dagValidator.ts
import { Edge, Connection } from 'reactflow';

export function hasCycle(edges: Edge[], newConnection: Connection | Edge): boolean {
  const adjacencyList: { [key: string]: string[] } = {};

  edges.forEach((edge) => {
    if (!adjacencyList[edge.source]) {
      adjacencyList[edge.source] = [];
    }
    adjacencyList[edge.source].push(edge.target);
  });

  if (newConnection.source && newConnection.target) {
    if (!adjacencyList[newConnection.source]) {
      adjacencyList[newConnection.source] = [];
    }
    adjacencyList[newConnection.source].push(newConnection.target);
  }

  const visited: { [key: string]: boolean } = {};
  const visiting: { [key: string]: boolean } = {};

  function dfs(nodeId: string): boolean {
    visiting[nodeId] = true;
    const neighbors = adjacencyList[nodeId] || [];

    for (const neighbor of neighbors) {
      if (visiting[neighbor]) {
        return true; 
      }
      if (!visited[neighbor]) {
        if (dfs(neighbor)) return true;
      }
    }

    visiting[nodeId] = false;
    visited[nodeId] = true;
    return false;
  }

  const allNodes = Object.keys(adjacencyList);
  for (const nodeId of allNodes) {
    if (!visited[nodeId]) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}