import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileSpreadsheet, 
  ClipboardCheck, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  CheckSquare, 
  Clock, 
  HardHat,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { currentRole, approvals, offlineDraftsCount } = useApp();

  const pendingApprovalsCount = approvals.filter(a => a.status === 'Pending').length;

  const navItems = [
    {
      id: 'owner_dashboard',
      label: 'Portfolio & Risk',
      icon: LayoutDashboard,
      roles: ['Owner', 'ProjectManager', 'Accountant'],
      badge: null,
    },
    {
      id: 'projects',
      label: 'Projects & Tasks',
      icon: FolderKanban,
      roles: ['Owner', 'ProjectManager', 'QuantitySurveyor', 'SiteEngineer', 'Accountant'],
      badge: null,
    },
    {
      id: 'boq',
      label: 'BOQ & Estimates',
      icon: FileSpreadsheet,
      roles: ['Owner', 'ProjectManager', 'QuantitySurveyor'],
      badge: 'v1.0',
    },
    {
      id: 'site_today',
      label: "Today's Site Log",
      icon: HardHat,
      roles: ['Owner', 'ProjectManager', 'SiteEngineer', 'Subcontractor'],
      badge: offlineDraftsCount > 0 ? `${offlineDraftsCount} Draft` : 'Field',
    },
    {
      id: 'labour',
      label: 'Labour Muster',
      icon: Users,
      roles: ['Owner', 'ProjectManager', 'SiteEngineer', 'Accountant'],
      badge: null,
    },
    {
      id: 'materials',
      label: 'Materials & Stock',
      icon: Package,
      roles: ['Owner', 'ProjectManager', 'SiteEngineer', 'Storekeeper', 'ProcurementOfficer'],
      badge: null,
    },
    {
      id: 'subcontracts',
      label: 'Subcontracts & RA',
      icon: FileText,
      roles: ['Owner', 'ProjectManager', 'QuantitySurveyor', 'Accountant', 'Subcontractor'],
      badge: null,
    },
    {
      id: 'finance',
      label: 'Finance & Invoices',
      icon: Receipt,
      roles: ['Owner', 'Accountant'],
      badge: 'GL Sync',
    },
    {
      id: 'approvals',
      label: 'Approval Center',
      icon: CheckSquare,
      roles: ['Owner', 'ProjectManager', 'QuantitySurveyor'],
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeColor: 'bg-red-50 text-vorq-danger border-red-200',
    },
  ];

  // Filter items granted to the current role
  const allowedItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-vorq-surface border-r border-vorq-border min-h-[calc(100vh-4rem)] flex flex-col justify-between shrink-0 hidden md:flex select-none">
      <div className="py-4">
        <div className="px-5 mb-3 text-[11px] font-bold text-vorq-slate uppercase tracking-wider">
          Operations & Control
        </div>
        <nav className="space-y-1 px-3">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                  isActive
                    ? 'bg-blue-50 text-vorq-primary font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-vorq-ink'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition ${isActive ? 'text-vorq-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                    item.badgeColor || (isActive ? 'bg-white text-vorq-primary border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Scoping Notice & Build Info Footer */}
      <div className="p-4 border-t border-vorq-border bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-vorq-slate mb-1">
          <span className="font-semibold text-vorq-ink">VORQ v1.0 Core</span>
          <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-mono">MIT/v16</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          BuildSuite Core & ERPNext authoritative foundation. Zero fabricated metrics.
        </p>
      </div>
    </aside>
  );
};
