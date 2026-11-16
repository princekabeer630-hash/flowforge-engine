import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Building2, ShieldCheck, Key, CheckCircle2 } from 'lucide-react';

export default function TenantsPage() {
  const { tenantId } = useOutletContext<{ tenantId: string }>();

  const tenants = [
    {
      id: 'default-tenant',
      name: 'Default Organization',
      plan: 'Enterprise',
      isolation: 'Logical Header Isolation (x-tenant-id)',
      status: 'Active',
      rateLimit: '1,000 req/min'
    },
    {
      id: 'acme-corp',
      name: 'Acme Corporation',
      plan: 'Enterprise',
      isolation: 'Logical Header Isolation (x-tenant-id)',
      status: 'Active',
      rateLimit: '2,500 req/min'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Multi-Tenant Workspaces</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Data partitioning and tenant isolation controlled via <code className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">x-tenant-id</code> middleware
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tenants.map((tenant) => {
          const isCurrent = tenant.id === tenantId;
          return (
            <div
              key={tenant.id}
              className={`bg-white rounded-xl border-2 p-6 shadow-sm transition-all ${
                isCurrent ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{tenant.name}</h3>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold uppercase bg-blue-100 text-blue-700 rounded-full">
                          Current Context
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">Tenant ID: {tenant.id}</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {tenant.status}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Isolation Strategy
                  </span>
                  <div className="font-medium text-slate-800 mt-1">{tenant.isolation}</div>
                </div>
                <div>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    Throughput Quota
                  </span>
                  <div className="font-medium text-slate-800 mt-1">{tenant.rateLimit}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}