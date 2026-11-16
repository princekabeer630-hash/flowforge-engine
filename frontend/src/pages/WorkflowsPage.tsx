import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, GitBranch, Play, Clock, Layers } from 'lucide-react';
import API from '../services/api';

export default function WorkflowsPage() {
  const { tenantId } = useOutletContext<{ tenantId: string }>();
  const navigate = useNavigate();

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const response = await API.get('/api/workflows', {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-tenant-id': tenantId
          }
        });
        const list = Array.isArray(response.data)
          ? response.data
          : response.data.workflows || response.data.data || [];
        setWorkflows(list);
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [tenantId]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Definitions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage Directed Acyclic Graph (DAG) templates for <span className="font-semibold text-slate-700">{tenantId}</span>
          </p>
        </div>

        <button
          onClick={() => navigate('/executions')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workflow DAG
        </button>
      </div>

      {/* Grid of Workflow Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">Loading saved workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <GitBranch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No workflows saved yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Design your first multi-step distributed saga workflow using the visual DAG builder.
          </p>
          <button
            onClick={() => navigate('/executions')}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf: any) => (
            <div
              key={wf._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    v1.0.0
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-4">{wf.name}</h3>
                <p className="text-xs font-mono text-slate-400 mt-1">ID: {wf._id}</p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {wf.nodes?.length || 0} Nodes
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {wf.edges?.length || 0} Edges
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/executions')}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Open in Execution Studio
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}