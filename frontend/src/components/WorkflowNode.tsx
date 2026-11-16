import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Database, CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';

export function WorkflowNode({ data }: { data: any }) {
  const status = data.status || 'IDLE';

  const getBorderStyle = () => {
    switch (status) {
      case 'RUNNING':
        return 'border-indigo-500 ring-4 ring-indigo-50 shadow-md';
      case 'COMPLETED':
        return 'border-emerald-400 shadow-sm';
      case 'FAILED':
        return 'border-rose-500 ring-4 ring-rose-50 shadow-md';
      default:
        return 'border-slate-200 hover:border-blue-400 shadow-sm';
    }
  };

  const getIconBadge = () => {
    if (data.nodeType === 'trigger') {
      return (
        <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5" />
        </div>
      );
    }
    if (status === 'RUNNING') {
      return (
        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
        <Database className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl border-2 px-4 py-3 min-w-[230px] transition-all ${getBorderStyle()}`}>
      {data.nodeType !== 'trigger' && (
        <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white" />
      )}

      <div className="flex items-center gap-3">
        {getIconBadge()}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">
            {data.label}
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-0.5">
            {status === 'COMPLETED' && (
              <>
                <span className="text-emerald-600 font-medium">{data.subtitle || 'Completed'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-400">{data.duration || '234ms'}</span>
              </>
            )}
            {status === 'RUNNING' && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                <span className="text-indigo-600 font-medium">Running...</span>
                <span className="text-slate-400 ml-1">{data.duration || '1.2s'}</span>
              </>
            )}
            {status === 'FAILED' && (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-rose-600 font-medium">Failed</span>
              </>
            )}
            {status === 'IDLE' && (
              <>
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">{data.subtitle || 'Ready'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white" />
    </div>
  );
}