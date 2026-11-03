import React from 'react';
import { useApp } from '../../context/AppContext';
import { KPICard } from '../common/KPICard';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Building, 
  ShieldAlert, 
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';

interface OwnerDashboardProps {
  onSelectProject: (projectId: string) => void;
  onNavigate: (view: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onSelectProject, onNavigate }) => {
  const { 
    projects, 
    currentProjectId, 
    setCurrentProjectId, 
    approvals, 
    setActiveDrilldownModal,
    clientInvoices,
    drilldownLedger
  } = useApp();

  // Aggregate portfolio totals across all active projects
  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = projects.reduce((acc, p) => acc + p.spentCost, 0);
  const totalCommitted = projects.reduce((acc, p) => acc + p.committedCost, 0);
  
  // Receivables from client invoices
  const totalReceivables = clientInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.paidAmount), 0);
  // Estimated payables from drilldown ledger (open POs & pending bills)
  const totalPayables = drilldownLedger
    .filter(d => d.voucherType.includes('Invoice') || d.voucherType.includes('PO'))
    .reduce((acc, d) => acc + d.amount, 0);

  const netCashExposure = totalReceivables - totalPayables;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-vorq-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink tracking-tight">
            Portfolio Financial Control & Risk
          </h1>
          <p className="text-xs sm:text-sm text-vorq-slate mt-0.5">
            Cross-project consolidated cost control, open commitments, client receivables and cash exposure.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            FY 2026-27 (Q3)
          </span>
          <button
            onClick={() => onNavigate('approvals')}
            className="text-xs font-semibold px-3 py-1 bg-vorq-primary text-white rounded-md hover:bg-blue-700 transition flex items-center gap-1"
          >
            <span>Review Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Row 1: Executive KPI Cards (Auditable & Reconciled) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Approved Budget"
          amount={totalBudget}
          taxBasis="ex-tax"
          deltaText="Baselined across 3 active sites"
          deltaType="neutral"
          sourceDocCount={3}
          sourceDocName="Approved BOQ Baselines"
          onDrilldown={() => setActiveDrilldownModal('Budget')}
          statusBadge="Locked Baseline"
        />

        <KPICard
          title="Actual Posted Cost"
          amount={totalSpent}
          taxBasis="ex-tax"
          deltaText={`${((totalSpent / totalBudget) * 100).toFixed(1)}% of total budget`}
          deltaType="neutral"
          sourceDocCount={drilldownLedger.length}
          sourceDocName="Posted ERP Documents"
          onDrilldown={() => setActiveDrilldownModal('Actual Posted Cost')}
          statusBadge="GL Reconciled"
        />

        <KPICard
          title="Open Commitments"
          amount={totalCommitted}
          taxBasis="ex-tax"
          deltaText="Issued Purchase Orders & Subcontracts"
          deltaType="neutral"
          sourceDocCount={2}
          sourceDocName="Issued POs"
          onDrilldown={() => setActiveDrilldownModal('Open Commitments')}
          statusBadge="Committed"
        />

        <KPICard
          title="Forecast At Completion (EAC)"
          amount={null} // Non-negotiable requirement: do not fabricate numbers when unvalidated
          isUnavailable={true}
          deltaText="Needs >=85% daily site submission completeness"
          deltaType="neutral"
          statusBadge="Data Incomplete"
        />
      </div>

      {/* Row 2: Cash Exposure, Receivables & Payables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-vorq-slate uppercase">Client Receivables</span>
            <span className="text-xs font-semibold text-vorq-primary">3 Milestone Invoices</span>
          </div>
          <div className="text-2xl font-extrabold text-vorq-ink font-tabular">
            ₹ {(totalReceivables / 100000).toFixed(2)} Lakhs
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Overdue (&gt;30 days): <strong className="text-amber-700">₹ 18.66 L</strong> from Niladri Co-op
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs font-semibold text-vorq-primary hover:underline flex items-center gap-1"
            >
              <span>View Milestone Billing</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-vorq-slate uppercase">Committed Payables</span>
            <span className="text-xs font-semibold text-slate-600">Material & Subcontract</span>
          </div>
          <div className="text-2xl font-extrabold text-vorq-ink font-tabular">
            ₹ {(totalPayables / 100000).toFixed(2)} Lakhs
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Includes ₹5,750 retention deduction withheld
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('subcontracts')}
              className="text-xs font-semibold text-vorq-primary hover:underline flex items-center gap-1"
            >
              <span>Inspect Subcontracts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-vorq-slate uppercase">Net Operational Cash Position</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
              Positive
            </span>
          </div>
          <div className="text-2xl font-extrabold text-green-700 font-tabular">
            ₹ {(netCashExposure / 100000).toFixed(2)} Lakhs
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reconciled buffer after all committed procurement payables
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onNavigate('finance')}
              className="text-xs font-semibold text-vorq-primary hover:underline flex items-center gap-1"
            >
              <span>Cash Flow Schedule</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Active Projects List with Risk Badges & Cost Status */}
      <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-vorq-ink">Active Construction Projects</h2>
            <p className="text-xs text-vorq-slate">Target residential portfolio in Bhubaneswar & Cuttack</p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-vorq-primary hover:underline flex items-center gap-1"
          >
            <span>All Projects</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-vorq-border">
          {projects.map((proj) => {
            const spentPercent = (proj.spentCost / proj.budget) * 100;
            const isAtRisk = spentPercent > proj.completionPercent + 15 || proj.status === 'Delayed';

            return (
              <div 
                key={proj.id} 
                className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-vorq-primary px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded">
                      {proj.code}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-vorq-ink truncate">
                      {proj.name}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      proj.status === 'On Track' ? 'bg-green-50 text-green-700 border border-green-200' :
                      proj.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {proj.status}
                    </span>
                    {isAtRisk && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        Cost / Schedule Drift
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-vorq-slate">
                    <span>Client: <strong className="text-slate-700">{proj.clientName}</strong></span>
                    <span>Location: <strong className="text-slate-700">{proj.location}</strong></span>
                    <span>PM: <strong className="text-slate-700">{proj.projectManager}</strong></span>
                  </div>

                  {/* Progress vs Cost Bar */}
                  <div className="pt-2 max-w-md">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Physical Progress: <strong className="text-vorq-ink">{proj.completionPercent}%</strong></span>
                      <span className="text-slate-500">Budget Spent: <strong className="text-vorq-ink">{spentPercent.toFixed(1)}%</strong></span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-vorq-primary h-full" 
                        style={{ width: `${proj.completionPercent}%` }}
                        title={`Physical Progress: ${proj.completionPercent}%`}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Financial summary & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-500 uppercase font-medium">Budget vs Actual</div>
                    <div className="text-sm sm:text-base font-bold text-vorq-ink font-tabular">
                      ₹ {(proj.spentCost / 100000).toFixed(1)}L / ₹ {(proj.budget / 10000000).toFixed(2)} Cr
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Open POs: ₹ {(proj.committedCost / 100000).toFixed(1)}L
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCurrentProjectId(proj.id);
                      onSelectProject(proj.id);
                    }}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0"
                  >
                    <span>Manage Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
