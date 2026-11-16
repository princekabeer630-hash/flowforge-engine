import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  PlayCircle,
  Building2,
  Cpu,
  Activity,
  Search,
  LogOut
} from 'lucide-react';

export function Layout() {
  const [tenantId, setTenantId] = useState('default-tenant');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', path: '/workflows', icon: GitBranch },
    { name: 'Executions', path: '/executions', icon: PlayCircle },
    { name: 'Tenants', path: '/tenants', icon: Building2 },
    { name: 'Workers', path: '/workers', icon: Cpu },
    { name: 'Monitoring', path: '/monitoring', icon: Activity }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Dark Slate Sidebar */}
      <aside className="w-60 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <span className="text-white font-bold text-xl tracking-tight">FlowForge</span>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="text-sm font-medium text-slate-500">
            Enterprise Saga & Workflow Orchestrator
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col border border-slate-200 rounded-lg px-3 py-1 bg-slate-50">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Current Tenant</span>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="default-tenant">default-tenant</option>
                <option value="acme-corp">Acme Corp</option>
              </select>
            </div>

            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search workflows, executions..."
                className="pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200">
              PK
            </div>
          </div>
        </header>

        {/* Active Page Renders Here */}
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ tenantId }} />
        </main>
      </div>
    </div>
  );
}