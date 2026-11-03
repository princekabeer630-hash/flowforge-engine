import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { hasCycle } from '../utils/dagValidator';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start Trigger (HTTP Webhook)' },
    position: { x: 250, y: 50 },
    style: { border: '1px solid #007bff', padding: 10, borderRadius: 8, background: '#e6f2ff' }
  },
  {
    id: '2',
    data: { label: 'Task Node 1 (Process Payload)' },
    position: { x: 250, y: 180 },
    style: { border: '1px solid #28a745', padding: 10, borderRadius: 8, background: '#e6ffe6' }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true }
];

export default function Dashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('My First Workflow');
  const navigate = useNavigate();

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Check if connecting these nodes introduces a cycle/loop
      if (hasCycle(edges, params)) {
        alert('⚠️ Invalid Connection: This link creates an infinite loop. Workflows must be Directed Acyclic Graphs (DAGs)!');
        return; 
      }

      // If valid, add the edge
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [edges, setEdges]
  );

  const addNode = () => {
    const newNodeId = (nodes.length + 1).toString();
    const newNode: Node = {
      id: newNodeId,
      data: { label: `Task Node ${newNodeId}` },
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      style: { border: '1px solid #6c757d', padding: 10, borderRadius: 8, background: '#ffffff' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSaveWorkflow = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'default-tenant'
        },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Workflow saved successfully to MongoDB!');
      } else {
        alert(data.error || 'Failed to save workflow');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        height: '60px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '20px', margin: 0, color: '#333' }}>FlowForge Canvas</h1>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={addNode}
            style={{ padding: '8px 14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            + Add Task Node
          </button>
          <button
            onClick={handleSaveWorkflow}
            style={{ padding: '8px 14px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            💾 Save Workflow
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Visual Canvas Area */}
      <div style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}