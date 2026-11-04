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
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);

  // State for Node Configuration Sidebar
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeLabelInput, setNodeLabelInput] = useState('');
  const [nodePayloadInput, setNodePayloadInput] = useState(''); // NEW: Custom payload state

  const navigate = useNavigate();

  // Handle clicking a node to open its configuration panel and populate values
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setNodeLabelInput(node.data?.label || '');
    setNodePayloadInput(node.data?.payload || '{\n  "key": "value"\n}');
  }, []);

  // Handle saving both label and custom JSON payload to the selected node
  const handleUpdateNodeConfig = () => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: { 
              ...node.data, 
              label: nodeLabelInput,
              payload: nodePayloadInput 
            }
          };
        }
        return node;
      })
    );
    alert('Node configuration updated with custom payload!');
  };

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
        setSavedWorkflowId(data.workflow?._id || data.data?._id);
        alert('Workflow saved successfully to MongoDB!');
      } else {
        alert(data.error || 'Failed to save workflow');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    }
  };

  const handleRunWorkflow = async () => {
    if (!savedWorkflowId) {
      alert('Please save the workflow first before running it!');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/workflows/${savedWorkflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'default-tenant'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setExecutionTrace(data.trace);
        alert(`Workflow Executed Successfully! Total Steps: ${data.totalSteps}`);
      } else {
        alert(data.error || 'Execution failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server during execution.');
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={addNode}
            style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            + Add Task Node
          </button>
          <button
            onClick={handleSaveWorkflow}
            style={{ padding: '8px 12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            💾 Save
          </button>
          <button
            onClick={handleRunWorkflow}
            style={{ padding: '8px 12px', backgroundColor: '#17a2b8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            ▶ Run Workflow
          </button>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Layout Area (Canvas + Sidebars) */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* Node Configuration Panel (Left Sidebar) */}
        {selectedNodeId && (
          <div style={{
            width: '300px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e0e0e0',
            padding: '16px',
            boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
            zIndex: 10,
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '15px', marginTop: 0, color: '#333', borderBottom: '2px solid #007bff', paddingBottom: '8px' }}>
              ⚙️ Configure Node
            </h3>
            <div style={{ marginBottom: '12px', fontSize: '12px', color: '#666' }}>
              Node ID: <b>{selectedNodeId}</b>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
              Node Label / Task Name
            </label>
            <input
              type="text"
              value={nodeLabelInput}
              onChange={(e) => setNodeLabelInput(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '12px' }}
            />

            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
              Custom Payload / Endpoint (JSON)
            </label>
            <textarea
              rows={5}
              value={nodePayloadInput}
              onChange={(e) => setNodePayloadInput(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'monospace', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '12px' }}
            />

            <button
              onClick={handleUpdateNodeConfig}
              style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
            >
              Save Configuration
            </button>
            <button
              onClick={() => setSelectedNodeId(null)}
              style={{ width: '100%', padding: '6px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px', fontSize: '12px' }}
            >
              Close Panel
            </button>
          </div>
        )}

        {/* Main Visual Canvas Area */}
        <div style={{ flex: 1, height: '100%', backgroundColor: '#f8f9fa' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>

        {/* Execution Trace Sidebar (Right Panel) */}
        {executionTrace.length > 0 && (
          <div style={{
            width: '320px',
            backgroundColor: '#ffffff',
            borderLeft: '1px solid #e0e0e0',
            padding: '16px',
            overflowY: 'auto',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.05)',
            zIndex: 10
          }}>
            <h3 style={{ fontSize: '16px', marginTop: 0, color: '#333', borderBottom: '2px solid #17a2b8', paddingBottom: '8px' }}>
              ⚡ Execution Trace
            </h3>
            {executionTrace.map((step, idx) => (
              <div key={idx} style={{
                marginBottom: '12px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: '#f1f8f5',
                border: '1px solid #28a745',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#28a745' }}>✓ {step.label}</div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>Status: {step.status}</div>
                <div style={{ color: '#999', fontSize: '10px' }}>{new Date(step.timestamp).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}