import { io } from 'socket.io-client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
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
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Save,
  Play,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Loader2,
  Database
} from 'lucide-react';
import { hasCycle } from '../utils/dagValidator';
import { WorkflowNode } from '../components/WorkflowNode';
import API from '../services/api';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'workflowNode',
    data: {
      label: 'Start Trigger',
      subtitle: 'HTTP Webhook',
      nodeType: 'trigger',
      status: 'IDLE',
      duration: '234ms',
      service: 'Webhook Gateway'
    },
    position: { x: 180, y: 40 }
  },
  {
    id: '2',
    type: 'workflowNode',
    data: {
      label: 'Process Payload',
      subtitle: 'Task Node 1',
      nodeType: 'task',
      status: 'IDLE',
      duration: '512ms',
      service: 'Payload Processor'
    },
    position: { x: 180, y: 165 }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }
];

export default function Dashboard() {
  const { tenantId } = useOutletContext<{ tenantId: string }>();
  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('Order Processing Workflow');
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [executionTrace, setExecutionTrace] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Node Configuration Inspector State
  const [selectedNodeId, setSelectedNodeId] = useState<string>('2');
  const [nodeLabelInput, setNodeLabelInput] = useState('Process Payload');
  const [nodePayloadInput, setNodePayloadInput] = useState('{\n  "key": "value"\n}');

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || nodes[0],
    [nodes, selectedNodeId]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setNodeLabelInput(node.data?.label || '');
    setNodePayloadInput(node.data?.payload || '{\n  "key": "value"\n}');
  }, []);

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

  // WebSocket Real-Time Execution Telemetry
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('workflow_execution_step', (data) => {
      setExecutionTrace((prev) => [...prev, data.step]);
      const stepStatus = data.step.status === 'FAILED' ? 'FAILED' : 'COMPLETED';

      setNodes((nds) =>
        nds.map((node) => {
          if (String(node.id) === String(data.step.nodeId)) {
            return {
              ...node,
              data: {
                ...node.data,
                status: stepStatus,
                duration: data.step.duration || '234ms'
              }
            };
          }
          return node;
        })
      );
    });

    socket.on('workflow_execution_completed', (data) => {
      console.log(data.message);
      setIsRunning(false);
    });

    socket.on('workflow_db_insert', (data) => {
      console.log(data.message, data.workflow);
    });

    socket.on('workflow_db_update', (data) => {
      console.log(data.message, data.updatedFields);
    });

    return () => {
      socket.disconnect();
    };
  }, [setNodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      if (hasCycle(edges, params)) {
        alert('Invalid Connection: This link creates an infinite loop. Workflows must be Directed Acyclic Graphs (DAGs)!');
        return;
      }
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds)
      );
    },
    [edges, setEdges]
  );

  const addNode = () => {
    const newNodeId = (nodes.length + 1).toString();
    const newNode: Node = {
      id: newNodeId,
      type: 'workflowNode',
      data: {
        label: `Task Node ${newNodeId}`,
        subtitle: 'Worker Task',
        nodeType: 'task',
        status: 'IDLE',
        service: 'Microservice Worker'
      },
      position: { x: 180, y: nodes.length * 125 + 40 }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSaveWorkflow = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await API.post(
        '/api/workflows',
        { name: workflowName, nodes, edges },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': tenantId || 'default-tenant'
          }
        }
      );

      const data = response.data;
      setSavedWorkflowId(data.workflow?._id || data.data?._id);
      alert('Workflow saved successfully to MongoDB!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Error connecting to backend server.');
    }
  };

  const handleRunWorkflow = async () => {
    if (!savedWorkflowId) {
      alert('Please save the workflow first before running it!');
      return;
    }

    setIsRunning(true);
    setExecutionTrace([]);

    setNodes((nds) =>
      nds.map((node, idx) => ({
        ...node,
        data: { ...node.data, status: idx === 0 ? 'RUNNING' : 'IDLE' }
      }))
    );

    const token = localStorage.getItem('token');
    try {
      await API.post(
        `/api/workflows/${savedWorkflowId}/execute`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': tenantId || 'default-tenant'
          }
        }
      );
    } catch (err: any) {
      setIsRunning(false);
      console.error(err);
      alert(err.response?.data?.error || 'Error connecting to backend server during execution.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Execution Details Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">Execution Details</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isRunning
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isRunning ? 'Running' : 'Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Execution of</span>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-xs font-semibold text-slate-800 border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 bg-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addNode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Add Task Node
          </button>
          <button
            onClick={handleSaveWorkflow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600" />
            Save Workflow
          </button>
          <button
            onClick={handleRunWorkflow}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            Run Workflow
          </button>
          <button
            onClick={handleRunWorkflow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
          <button
            onClick={() => setIsRunning(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </div>

      {/* Execution Metadata Strip */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 grid grid-cols-2 md:grid-cols-6 gap-4 text-xs shrink-0">
        <div>
          <div className="text-slate-400">Execution ID</div>
          <div className="font-mono font-medium text-slate-800 mt-0.5 truncate">
            {savedWorkflowId ? `exec_${savedWorkflowId.slice(-8)}` : 'exec_unsaved'}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Workflow</div>
          <div className="font-medium text-blue-600 mt-0.5 truncate">{workflowName}</div>
        </div>
        <div>
          <div className="text-slate-400">Version</div>
          <div className="font-medium text-slate-800 mt-0.5">v1.0.0</div>
        </div>
        <div>
          <div className="text-slate-400">Mode</div>
          <div className="font-medium text-slate-800 mt-0.5">DAG Orchestration</div>
        </div>
        <div>
          <div className="text-slate-400">Triggered By</div>
          <div className="font-medium text-slate-800 mt-0.5">Manual (Papan Kumar)</div>
        </div>
        <div>
          <div className="text-slate-400">Tenant</div>
          <div className="font-medium text-slate-800 mt-0.5">{tenantId || 'default-tenant'}</div>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
        {/* Column 1: Visual Flow Canvas */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-6">
            <span className="text-sm font-semibold text-slate-900">Execution Flow</span>
            <div className="flex gap-4 text-xs font-medium">
              <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Flow View</span>
              <span className="text-slate-400 pb-1">DAG Canvas</span>
            </div>
          </div>

          <div className="flex-1 bg-slate-50/50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
            >
              <Controls />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
            </ReactFlow>
          </div>
        </div>

        {/* Column 2: Current Step Details Inspector */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 flex flex-col overflow-y-auto shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Current Step Details</h2>

          {selectedNode && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-900 truncate">{selectedNode.data?.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{selectedNode.data?.service || 'Task Worker'}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                  {selectedNode.data?.status || 'Ready'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Node Label / Task Name</label>
                  <input
                    type="text"
                    value={nodeLabelInput}
                    onChange={(e) => setNodeLabelInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <div className="text-slate-400">Node ID</div>
                    <div className="font-medium text-slate-700 mt-0.5">#{selectedNode.id}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Duration</div>
                    <div className="font-medium text-slate-700 mt-0.5">{selectedNode.data?.duration || '234ms'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-slate-700">Input Data</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">JSON</span>
                  </div>
                  <textarea
                    rows={6}
                    value={nodePayloadInput}
                    onChange={(e) => setNodePayloadInput(e.target.value)}
                    className="w-full p-2.5 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleUpdateNodeConfig}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition-colors shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </>
          )}
        </div>

        {/* Column 3: Execution Status Stepper */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-4 flex flex-col overflow-y-auto shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Execution Status</h2>

          <div className="space-y-4">
            {nodes.map((node, index) => {
              const traceMatch = executionTrace.find((t) => String(t.nodeId) === String(node.id));
              const status = traceMatch ? traceMatch.status : node.data?.status || 'PENDING';

              return (
                <div key={node.id} className="flex items-start justify-between relative">
                  {index !== nodes.length - 1 && (
                    <div className="absolute left-3 top-7 bottom-[-16px] w-0.5 bg-slate-200" />
                  )}

                  <div className="flex items-start gap-3">
                    {status === 'COMPLETED' ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : status === 'RUNNING' ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : status === 'FAILED' ? (
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 z-10">
                        <XCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white shrink-0 z-10" />
                    )}

                    <div>
                      <div className="text-xs font-semibold text-slate-800">{node.data?.label}</div>
                      <div
                        className={`text-[11px] font-medium ${
                          status === 'COMPLETED'
                            ? 'text-emerald-600'
                            : status === 'RUNNING'
                            ? 'text-blue-600'
                            : status === 'FAILED'
                            ? 'text-rose-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {status === 'COMPLETED'
                          ? 'Completed'
                          : status === 'RUNNING'
                          ? 'Running'
                          : status === 'FAILED'
                          ? 'Failed'
                          : 'Pending'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {traceMatch?.duration || (status === 'COMPLETED' ? '234ms' : '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}