import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { OwnerDashboard } from './components/views/OwnerDashboard';
import { ProjectOverview } from './components/views/ProjectOverview';
import { BOQWorkspace } from './components/views/BOQWorkspace';
import { SiteDailyReportView } from './components/views/SiteDailyReportView';
import { LabourMusterView } from './components/views/LabourMusterView';
import { MaterialsManagement } from './components/views/MaterialsManagement';
import { SubcontractsView } from './components/views/SubcontractsView';
import { FinanceWorkspace } from './components/views/FinanceWorkspace';
import { ApprovalsCenter } from './components/views/ApprovalsCenter';
import { DrilldownModal } from './components/common/DrilldownModal';
import { X, Layers, Users, Package, FileText, Receipt, CheckSquare, HardHat, FileSpreadsheet } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    currentRole, 
    activeDrilldownModal, 
    setActiveDrilldownModal, 
    drilldownLedger,
    setCurrentProjectId
  } = useApp();

  const [activeView, setActiveView] = useState<string>('owner_dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // If role is switched to SiteEngineer or Subcontractor, auto-direct to relevant landing
  React.useEffect(() => {
    if (currentRole === 'SiteEngineer' && activeView === 'owner_dashboard') {
      setActiveView('site_today');
    } else if (currentRole === 'Subcontractor' && activeView === 'owner_dashboard') {
      setActiveView('subcontracts');
    } else if (currentRole === 'QuantitySurveyor' && activeView === 'owner_dashboard') {
      setActiveView('boq');
    }
  }, [currentRole]);

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id);
    setActiveView('projects');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'owner_dashboard':
        return <OwnerDashboard onSelectProject={handleSelectProject} onNavigate={(v) => setActiveView(v)} />;
      case 'projects':
        return <ProjectOverview onNavigate={(v) => setActiveView(v)} />;
      case 'boq':
        return <BOQWorkspace />;
      case 'site_today':
        return <SiteDailyReportView />;
      case 'labour':
        return <LabourMusterView />;
      case 'materials':
        return <MaterialsManagement />;
      case 'subcontracts':
        return <SubcontractsView />;
      case 'finance':
        return <FinanceWorkspace />;
      case 'approvals':
        return <ApprovalsCenter />;
      default:
        return <OwnerDashboard onSelectProject={handleSelectProject} onNavigate={(v) => setActiveView(v)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-vorq-canvas text-vorq-ink">
      {/* Top Bar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Desktop Sidebar */}
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Bottom Mobile Navigation */}
      <MobileNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenMenu={() => setMobileMenuOpen(true)} 
      />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/50 md:hidden animate-in fade-in">
          <div className="bg-white rounded-t-2xl p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-vorq-border">
              <span className="font-bold text-sm text-vorq-ink">All Modules & Workspaces</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'owner_dashboard', label: 'Portfolio Control', icon: Layers },
                { id: 'projects', label: 'Projects & Tasks', icon: Layers },
                { id: 'boq', label: 'BOQ Baseline', icon: FileSpreadsheet },
                { id: 'site_today', label: "Today's Site Log", icon: HardHat },
                { id: 'labour', label: 'Labour Muster', icon: Users },
                { id: 'materials', label: 'Materials & Stock', icon: Package },
                { id: 'subcontracts', label: 'Subcontracts & RA', icon: FileText },
                { id: 'finance', label: 'Finance & Invoices', icon: Receipt },
                { id: 'approvals', label: 'Approval Inbox', icon: CheckSquare },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveView(m.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-3 border border-vorq-border rounded-lg text-left hover:bg-blue-50 transition flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4 text-vorq-primary shrink-0" />
                    <span className="font-medium text-slate-800">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Source Document Lineage Modal */}
      {activeDrilldownModal && (
        <DrilldownModal
          title={activeDrilldownModal}
          category={activeDrilldownModal}
          records={drilldownLedger}
          onClose={() => setActiveDrilldownModal(null)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
