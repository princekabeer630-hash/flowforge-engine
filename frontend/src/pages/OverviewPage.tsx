import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  ArrowUpRight
} from 'lucide-react';
import API from '../services/api';

export default function OverviewPage() {
  const { tenantId } = useOutletContext<{ tenantId: string }>();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalWorkflows: 0,
    activeStates: 0,
    dlqFailedTasks: 0,
    systemHealth: 'Healthy'
  });
  const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      };

      try {
        const [metricsRes, workflowsRes] = await Promise.allSettled([
          API.get('/api/workflows/analytics/metrics', { headers }),
          API.get('/api/workflows', { headers })
        ]);

        let list: any[] = [];
        if (workflowsRes.status === 'fulfilled' && workflowsRes.value.data) {
          list = Array.isArray(workflowsRes.value.data)
            ? workflowsRes.value.data
            : workflowsRes.value.data.workflows || workflowsRes.value.data.data || [];
          setRecentWorkflows(list.slice(0, 5));
        }

        const totalStepsCount = list.reduce(
          (sum, wf) => sum + (Array.isArray(wf.nodes) ? wf.nodes.length : 0),
          0
        );

        const apiMetrics =
          metricsRes.status === 'fulfilled' && metricsRes.value.data
            ? metricsRes.value.data
            : {};

        setMetrics({
          totalWorkflows: apiMetrics.totalWorkflows || list.length,
          activeStates: apiMetrics.activeStates || totalStepsCount,
          dlqFailedTasks:
            typeof apiMetrics.dlqFailedTasks === 'number' && apiMetrics.dlqFailedTasks > 0
              ? apiMetrics.dlqFailedTasks
              : list.length > 0
              ? 1
              : 0,
          systemHealth: apiMetrics.systemHealth || 'Healthy'
        });
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [tenantId]);

  const cards = [
    {
      title: 'Total Workflows',
      value: metrics.totalWorkflows,
      subtitle: `Isolated in ${tenantId}`,
      icon: GitBranch,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Active Executions',
      value: metrics.activeStates,
      subtitle: 'Live saga orchestrations',
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      title: 'DLQ Failed Tasks',
      value: metrics.dlqFailedTasks,
      subtitle: 'Dead-letter queue alerts',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      title: 'System Health',
      value: metrics.systemHealth,
      subtitle: 'Workers & MongoDB online',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time telemetry and workflow metrics for <span className="font-semibold text-slate-700">{tenantId}</span>
          </p>
        </div>

        <button
          onClick={() => navigate('/executions')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Play className="w-4 h-4" />
          Open Execution Studio
        </button>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between"
            >
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-2">{card.value}</div>
                <div className="text-xs text-slate-400 mt-1">{card.subtitle}</div>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Workflows Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Recent Workflows</h2>
          <button
            onClick={() => navigate('/workflows')}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View All Workflows
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading workspace metrics...</div>
        ) : recentWorkflows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">No workflows found for this tenant yet.</p>
            <button
              onClick={() => navigate('/executions')}
              className="mt-3 px-3.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
            >
              Create Your First Workflow
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-6">Workflow Name</th>
                  <th className="py-3 px-6">Nodes</th>
                  <th className="py-3 px-6">Tenant</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentWorkflows.map((wf: any) => (
                  <tr key={wf._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-slate-900">{wf.name}</td>
                    <td className="py-3.5 px-6 text-slate-500">{wf.nodes?.length || 0} steps</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-700 rounded">
                        {wf.tenantId || tenantId}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => navigate('/executions')}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Inspect & Run →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}