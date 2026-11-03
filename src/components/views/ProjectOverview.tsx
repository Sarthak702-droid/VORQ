import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  HardHat,
  Package,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ProjectOverviewProps {
  onNavigate: (view: string) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ onNavigate }) => {
  const { currentProject, costCodes, tasks, boqRevisions } = useApp();
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule' | 'cost_codes' | 'team'>('summary');

  const projectBOQ = boqRevisions.find(b => b.projectId === currentProject.id);

  const spentPercentage = (currentProject.spentCost / currentProject.budget) * 100;
  const committedPercentage = (currentProject.committedCost / currentProject.budget) * 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Project Banner & Meta Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-vorq-primary px-2 py-0.5 bg-blue-50 border border-blue-200 rounded">
                {currentProject.code}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                currentProject.status === 'On Track' ? 'bg-green-50 text-green-700 border border-green-200' :
                currentProject.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {currentProject.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink">
              {currentProject.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-vorq-slate mt-1.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentProject.location}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Client: {currentProject.clientName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target: {currentProject.targetDate}
              </span>
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('site_today')}
              className="px-3 py-2 bg-vorq-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs"
            >
              <HardHat className="w-4 h-4" />
              <span>Log Site Progress</span>
            </button>
            <button
              onClick={() => onNavigate('boq')}
              className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition flex items-center gap-1.5 border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span>View Approved BOQ</span>
            </button>
          </div>
        </div>

        {/* Budget vs Actual Progress Bar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-vorq-slate">Approved Budget (Ex-tax)</div>
            <div className="text-lg font-extrabold text-vorq-ink font-tabular">
              ₹ {(currentProject.budget / 10000000).toFixed(2)} Cr
            </div>
            <div className="text-[11px] text-slate-400">Baseline Hash: {projectBOQ?.baselineHash.substring(0, 10)}...</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-vorq-slate">Actual Posted Cost</div>
            <div className="text-lg font-extrabold text-vorq-ink font-tabular">
              ₹ {(currentProject.spentCost / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-green-700 font-medium">
              {spentPercentage.toFixed(1)}% spent to date
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-vorq-slate">Open PO Commitments</div>
            <div className="text-lg font-extrabold text-vorq-ink font-tabular">
              ₹ {(currentProject.committedCost / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              {committedPercentage.toFixed(1)}% committed
            </div>
          </div>
        </div>

        {/* Dual Progress Meter */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-vorq-ink">
              Physical Site Progress: <strong className="text-vorq-primary">{currentProject.completionPercent}%</strong>
            </span>
            <span className="text-vorq-slate">
              Financial Burn: <strong className="text-slate-800">{spentPercentage.toFixed(1)}%</strong>
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-vorq-primary h-full transition-all duration-300" 
              style={{ width: `${currentProject.completionPercent}%` }}
              title={`Physical Progress: ${currentProject.completionPercent}%`}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-vorq-border flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 font-semibold transition border-b-2 ${
            activeTab === 'summary' 
              ? 'border-vorq-primary text-vorq-primary' 
              : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          Executive Summary
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'schedule' 
              ? 'border-vorq-primary text-vorq-primary' 
              : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          <span>Schedule & Gantt</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cost_codes')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'cost_codes' 
              ? 'border-vorq-primary text-vorq-primary' 
              : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          <span>Cost Code Breakdown</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {costCodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 font-semibold transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'team' 
              ? 'border-vorq-primary text-vorq-primary' 
              : 'border-transparent text-vorq-slate hover:text-vorq-ink'
          }`}
        >
          <span>Assigned Roles & Scopes</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
            {currentProject.assignedRoles.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Executive Summary */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stage Progress Breakdown */}
            <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
              <h3 className="text-sm font-bold text-vorq-ink mb-3">Construction Stages Status</h3>
              <div className="space-y-3">
                {[
                  { stage: '1000 - Substructure & Foundation', progress: 100, status: 'Completed', color: 'bg-green-600' },
                  { stage: '2000 - Superstructure (RCC Frames & Masonry)', progress: 72, status: 'In Progress', color: 'bg-vorq-primary' },
                  { stage: '3000 - Internal & External Finishes', progress: 15, status: 'In Progress', color: 'bg-amber-500' },
                  { stage: '4000 - MEP & Concealed Utilities', progress: 25, status: 'In Progress', color: 'bg-blue-400' },
                ].map((stg, i) => (
                  <div key={i} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-vorq-ink">{stg.stage}</span>
                      <span className="font-bold text-slate-700">{stg.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`${stg.color} h-full`} style={{ width: `${stg.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Modules Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                onClick={() => onNavigate('boq')}
                className="p-4 bg-white border border-vorq-border rounded-vorq text-left hover:border-blue-300 hover:shadow-xs transition"
              >
                <FileSpreadsheet className="w-5 h-5 text-vorq-primary mb-2" />
                <div className="text-xs font-bold text-vorq-ink">BOQ Baseline</div>
                <div className="text-[11px] text-vorq-slate mt-0.5">11 Items • Locked</div>
              </button>

              <button 
                onClick={() => onNavigate('materials')}
                className="p-4 bg-white border border-vorq-border rounded-vorq text-left hover:border-blue-300 hover:shadow-xs transition"
              >
                <Package className="w-5 h-5 text-vorq-primary mb-2" />
                <div className="text-xs font-bold text-vorq-ink">Materials & POs</div>
                <div className="text-[11px] text-vorq-slate mt-0.5">340 Bags Cement</div>
              </button>

              <button 
                onClick={() => onNavigate('labour')}
                className="p-4 bg-white border border-vorq-border rounded-vorq text-left hover:border-blue-300 hover:shadow-xs transition"
              >
                <Users className="w-5 h-5 text-vorq-primary mb-2" />
                <div className="text-xs font-bold text-vorq-ink">Labour Muster</div>
                <div className="text-[11px] text-vorq-slate mt-0.5">46 Workers on Site</div>
              </button>

              <button 
                onClick={() => onNavigate('subcontracts')}
                className="p-4 bg-white border border-vorq-border rounded-vorq text-left hover:border-blue-300 hover:shadow-xs transition"
              >
                <Layers className="w-5 h-5 text-vorq-primary mb-2" />
                <div className="text-xs font-bold text-vorq-ink">Subcontracts</div>
                <div className="text-[11px] text-vorq-slate mt-0.5">2 Active Contractors</div>
              </button>
            </div>

          </div>

          {/* Right Sidebar: Key Project Metadata */}
          <div className="space-y-4">
            <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
              <h3 className="text-xs font-bold text-vorq-slate uppercase tracking-wider mb-3">
                Contract Snapshot
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Contract Value (ex-tax):</dt>
                  <dd className="font-bold text-vorq-ink">₹ {(currentProject.contractValue / 10000000).toFixed(2)} Cr</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Target Profit Margin:</dt>
                  <dd className="font-bold text-green-700">₹ {((currentProject.contractValue - currentProject.budget) / 100000).toFixed(2)} Lakhs (20%)</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Project Manager:</dt>
                  <dd className="font-medium text-slate-800">{currentProject.projectManager}</dd>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Commencement Date:</dt>
                  <dd className="font-medium text-slate-800">{currentProject.startDate}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-slate-500">Target Handover:</dt>
                  <dd className="font-medium text-slate-800">{currentProject.targetDate}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-blue-50/60 border border-blue-200 rounded-vorq p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-vorq-primary mb-1">
                <CheckCircle2 className="w-4 h-4 text-vorq-primary" />
                Role Scoped Tenant Site
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Assigned site users cannot access other projects or company P&L without explicit admin role grants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schedule & Gantt View */}
      {activeTab === 'schedule' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="p-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-vorq-ink">Project Work Breakdown & Critical Path</h3>
              <p className="text-xs text-vorq-slate">Reused BuildSuite task execution timeline with dependencies</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-50 text-vorq-primary border border-blue-200 rounded">
              Gantt View
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Task Description</th>
                  <th className="py-2.5 px-3">Cost Code</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">End Date</th>
                  <th className="py-2.5 px-3">Dependencies</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 w-40">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-vorq-primary">{t.id}</td>
                    <td className="py-3 px-3 font-medium text-vorq-ink">{t.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {t.costCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.startDate}</td>
                    <td className="py-3 px-3 text-slate-600">{t.endDate}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {t.dependencies.length > 0 ? t.dependencies.join(', ') : 'None'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${t.progressPercent === 100 ? 'bg-green-600' : 'bg-vorq-primary'}`} 
                            style={{ width: `${t.progressPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700 text-[11px]">{t.progressPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cost Code Breakdown */}
      {activeTab === 'cost_codes' && (
        <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
          <div className="p-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="text-sm font-bold text-vorq-ink">Cost Codes & Budget Allocation</h3>
              <p className="text-xs text-vorq-slate">Granular cost center tracking across Foundation, Structure, Finishes & MEP</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Allocated Budget (₹)</th>
                  <th className="py-2.5 px-3 text-right">Actual Spent (₹)</th>
                  <th className="py-2.5 px-3 text-right">Committed (₹)</th>
                  <th className="py-2.5 px-3 text-right">Remaining (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {costCodes.map((cc) => {
                  const remaining = cc.allocatedBudget - (cc.spentCost + cc.committedCost);
                  return (
                    <tr key={cc.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{cc.code}</td>
                      <td className="py-3 px-3 font-medium text-slate-600">{cc.category}</td>
                      <td className="py-3 px-3 font-medium text-vorq-ink">{cc.name}</td>
                      <td className="py-3 px-3 text-right font-tabular text-slate-900 font-semibold">
                        ₹ {cc.allocatedBudget.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-tabular text-vorq-ink font-bold">
                        ₹ {cc.spentCost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-tabular text-slate-600">
                        ₹ {cc.committedCost.toLocaleString('en-IN')}
                      </td>
                      <td className={`py-3 px-3 text-right font-tabular font-bold ${remaining < 0 ? 'text-vorq-danger' : 'text-vorq-success'}`}>
                        ₹ {remaining.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Assigned Roles & Scopes */}
      {activeTab === 'team' && (
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-vorq-ink">Project Team & Access Permissions</h3>
              <p className="text-xs text-vorq-slate">Assigned users have scoped access to this site and its documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentProject.assignedRoles.map((user, idx) => (
              <div key={idx} className="p-3 border border-vorq-border rounded-lg flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                    {user.userName[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-vorq-ink">{user.userName}</div>
                    <div className="text-[11px] text-vorq-slate">{user.role}</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-vorq-primary border border-blue-200">
                  Authorized
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
