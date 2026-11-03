import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  Bell, 
  ShieldCheck, 
  RefreshCw, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  UserCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    tenant, 
    currentRole, 
    setCurrentRole, 
    projects, 
    currentProjectId, 
    setCurrentProjectId, 
    currentProject,
    isOnline,
    toggleOnlineStatus,
    offlineDraftsCount,
    syncOfflineQueue,
    approvals
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'Owner', title: 'Owner / Director', desc: 'Portfolio P&L, Cash Exposure, Approvals' },
    { role: 'ProjectManager', title: 'Project Manager', desc: 'Schedules, Work Packages, Approvals' },
    { role: 'QuantitySurveyor', title: 'Quantity Surveyor (QS)', desc: 'BOQ Baselines, Measurement Books' },
    { role: 'SiteEngineer', title: 'Site Engineer', desc: 'Daily Progress, Field Muster, Photos' },
    { role: 'Storekeeper', title: 'Storekeeper', desc: 'Site Inventory, GRN Receipts, Issues' },
    { role: 'ProcurementOfficer', title: 'Procurement Officer', desc: 'Material Requests, PO Quotations' },
    { role: 'Accountant', title: 'Accountant', desc: 'Invoices, Receivables/Payables, GL' },
    { role: 'Subcontractor', title: 'Subcontractor (External)', desc: 'My Scope, Measured Bills & Retention' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-vorq-surface border-b border-vorq-border shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: VORQ Brand & Company Context */}
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center gap-2.5">
            <img 
              src="/assets/vorq-logo.png" 
              alt="VORQ" 
              className="h-9 w-9 object-contain rounded-lg border border-slate-700 bg-slate-900 p-0.5 shadow-sm"
              onError={(e) => {
                // fallback if image not found
                e.currentTarget.style.display = 'none';
              }} 
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-vorq-ink leading-tight flex items-center gap-1.5">
                VORQ
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-blue-50 text-vorq-primary rounded border border-blue-200">
                  Core
                </span>
              </span>
              <span className="text-[11px] text-vorq-slate truncate max-w-[150px] sm:max-w-[220px]">
                {tenant.name}
              </span>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-vorq-border" />

          {/* Project Switcher */}
          <div className="relative">
            <button
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-vorq-border hover:bg-slate-50 transition text-left text-sm"
            >
              <Building2 className="w-4 h-4 text-vorq-primary shrink-0" />
              <div className="flex flex-col truncate max-w-[140px] sm:max-w-[200px]">
                <span className="text-xs font-semibold text-vorq-ink truncate leading-tight">
                  {currentProject.name}
                </span>
                <span className="text-[10px] text-vorq-slate truncate">
                  {currentProject.code} • {currentProject.location}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-vorq shadow-lg border border-vorq-border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-medium text-vorq-slate uppercase tracking-wider border-b border-vorq-border">
                  Active Projects ({projects.length})
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-start justify-between hover:bg-blue-50 transition ${
                      p.id === currentProjectId ? 'bg-blue-50/70 border-l-2 border-vorq-primary' : ''
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-vorq-ink">{p.name}</div>
                      <div className="text-xs text-vorq-slate">{p.location} • ₹{(p.budget / 10000000).toFixed(2)} Cr Budget</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      p.status === 'On Track' ? 'bg-green-100 text-green-800' :
                      p.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls: Freshness, Offline Simulator, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Freshness Badge (Audit Requirement) */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 border border-green-200/80 rounded-md text-[11px] text-green-800">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span className="font-medium">ERP Ledger Reconciled</span>
            <span className="text-green-600 font-mono text-[10px]">17:30 IST</span>
          </div>

          {/* Network & Offline Draft Mode Simulator */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleOnlineStatus}
              title={isOnline ? 'Online mode active. Click to simulate site field offline mode.' : 'Offline mode active. Click to reconnect.'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
                isOnline 
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' 
                  : 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-green-600" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold">Site Offline</span>
                </>
              )}
            </button>

            {offlineDraftsCount > 0 && (
              <button
                onClick={syncOfflineQueue}
                title="Pending local drafts. Click to sync with server."
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-vorq-primary text-xs font-semibold rounded-md border border-blue-200 hover:bg-blue-100 transition"
              >
                <RefreshCw className="w-3 h-3 animate-spin text-vorq-primary" />
                <span>Sync ({offlineDraftsCount})</span>
              </button>
            )}
          </div>

          {/* Approvals / Notifications Button */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Approvals & System Alerts"
            >
              <Bell className="w-4 h-4" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-vorq-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-vorq shadow-xl border border-vorq-border py-2 z-50">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-vorq-border">
                  <span className="text-xs font-bold text-vorq-ink">Pending Approvals</span>
                  <span className="text-[11px] bg-red-50 text-vorq-danger px-1.5 py-0.5 rounded font-semibold">
                    {pendingApprovalsCount} actionable
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {approvals.slice(0, 4).map((a) => (
                    <div key={a.id} className="p-3 hover:bg-slate-50 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-vorq-ink">{a.type}</span>
                        <span className="text-[10px] text-slate-400">{a.referenceNo}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 line-clamp-1">{a.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span>{a.requestedBy}</span>
                        {a.amount && <span className="font-bold text-slate-900">₹{a.amount.toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-vorq-border hidden sm:block" />

          {/* Role Switcher (Crucial for testing all 8 personas) */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition"
            >
              <div className="w-6 h-6 rounded-full bg-vorq-primary text-white flex items-center justify-center font-bold text-xs">
                {currentRole[0]}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-vorq-ink leading-none">
                  {roles.find(r => r.role === currentRole)?.title.split('/')[0]}
                </span>
                <span className="text-[10px] text-vorq-primary font-medium">
                  Active Persona
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-vorq-primary" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-vorq shadow-xl border border-vorq-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-vorq-border">
                  <div className="text-xs font-bold text-vorq-ink flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-vorq-primary" />
                    Role-Based Workspace Switcher
                  </div>
                  <p className="text-[11px] text-vorq-slate mt-0.5">
                    Select a role to inspect its tailored navigation and permissions.
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setCurrentRole(r.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition ${
                        r.role === currentRole ? 'bg-blue-50/70 font-semibold' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        r.role === currentRole ? 'bg-vorq-primary' : 'bg-slate-300'
                      }`} />
                      <div>
                        <div className="text-xs font-bold text-vorq-ink">{r.title}</div>
                        <div className="text-[11px] text-vorq-slate">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
