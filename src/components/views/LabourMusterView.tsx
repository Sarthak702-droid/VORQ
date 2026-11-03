import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck,
  DollarSign,
  Clock,
  Lock
} from 'lucide-react';
import { LabourMusterEntry } from '../../types';

export const LabourMusterView: React.FC = () => {
  const { currentProject, labourMusters, submitLabourMuster } = useApp();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [costCode, setCostCode] = useState<string>('2020');
  const [entries, setEntries] = useState<LabourMusterEntry[]>([
    { trade: 'Head Mason (Mistri)', workerCount: 3, dailyRate: 850, shiftHours: 8, totalWages: 2550, costCode: '2030' },
    { trade: 'Skilled Mason', workerCount: 5, dailyRate: 750, shiftHours: 8, totalWages: 3750, costCode: '2030' },
    { trade: 'Bar Benders', workerCount: 6, dailyRate: 700, shiftHours: 8, totalWages: 4200, costCode: '2020' },
    { trade: 'Carpenters (Shuttering)', workerCount: 8, dailyRate: 720, shiftHours: 8, totalWages: 5760, costCode: '2020' },
    { trade: 'Male Unskilled Helper', workerCount: 14, dailyRate: 480, shiftHours: 8, totalWages: 6720, costCode: '2020' },
    { trade: 'Female Unskilled Helper', workerCount: 10, dailyRate: 480, shiftHours: 8, totalWages: 4800, costCode: '2030' },
  ]);

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const totalWorkers = entries.reduce((sum, e) => sum + e.workerCount, 0);
  const totalWages = entries.reduce((sum, e) => sum + (e.workerCount * e.dailyRate), 0);

  const handleUpdateWorkerCount = (index: number, count: number) => {
    const updated = [...entries];
    updated[index].workerCount = count;
    updated[index].totalWages = count * updated[index].dailyRate;
    setEntries(updated);
  };

  const handleUpdateDailyRate = (index: number, rate: number) => {
    const updated = [...entries];
    updated[index].dailyRate = rate;
    updated[index].totalWages = updated[index].workerCount * rate;
    setEntries(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitLabourMuster({
      projectId: currentProject.id,
      date,
      submittedBy: 'Er. Alok Das (Site Engineer)',
      linkedCostCode: costCode,
      entries,
      totalWages,
      totalWorkers
    });

    setFeedback(res);
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
            <Users className="w-6 h-6 text-vorq-primary" />
            Daily Labour Muster & Wage Costing
          </h1>
          <p className="text-xs text-vorq-slate mt-0.5">
            Log site workers by trade and shift. Allocates wage costs to canonical cost codes with duplicate-date protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Today's Headcount:</div>
            <div className="text-xl font-extrabold text-vorq-ink font-tabular">{totalWorkers} Workers</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Daily Wage Total:</div>
            <div className="text-xl font-extrabold text-vorq-primary font-tabular">₹ {totalWages.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-vorq border flex items-center gap-2 text-xs font-semibold ${
          feedback.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.success ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Muster Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Work Package Cost Code</label>
            <select
              value={costCode}
              onChange={(e) => setCostCode(e.target.value)}
              className="w-full px-3 py-2 border border-vorq-border rounded-lg text-xs bg-slate-50 font-medium"
            >
              <option value="2020">2020 - RCC Slabs and Beams Casting</option>
              <option value="2010">2010 - RCC Columns M25</option>
              <option value="2030">2030 - Brick Masonry 250mm</option>
              <option value="3010">3010 - Internal Plastering</option>
              <option value="1030">1030 - Foundation & Footings</option>
            </select>
          </div>
        </div>

        {/* Trade Entries Table */}
        <div className="border border-vorq-border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
            <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Trade / Skill Category</th>
                <th className="py-2.5 px-3">Cost Code</th>
                <th className="py-2.5 px-3 text-center">Shift</th>
                <th className="py-2.5 px-3 text-right">Daily Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Workers Present</th>
                <th className="py-2.5 px-3 text-right">Total Wages (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {entries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-semibold text-vorq-ink">{entry.trade}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {entry.costCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{entry.shiftHours} Hours</td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      min="100"
                      step="10"
                      value={entry.dailyRate}
                      onChange={(e) => handleUpdateDailyRate(idx, Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-vorq-border rounded text-xs text-right font-medium"
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      value={entry.workerCount}
                      onChange={(e) => handleUpdateWorkerCount(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-vorq-border rounded text-xs text-right font-bold bg-blue-50/50"
                    />
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular whitespace-nowrap">
                    ₹ {entry.totalWages.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-vorq-border font-bold">
              <tr>
                <td colSpan={4} className="py-3 px-3 text-right uppercase text-vorq-slate">
                  Consolidated Daily Wage Cost:
                </td>
                <td className="py-3 px-3 text-right font-bold text-vorq-ink">
                  {totalWorkers} workers
                </td>
                <td className="py-3 px-3 text-right text-vorq-primary text-sm font-tabular whitespace-nowrap">
                  ₹ {totalWages.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-between pt-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Submitted muster is permanently locked. Duplicate dates are rejected by system policy.</span>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-vorq-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-xs"
          >
            Post Daily Labour Muster
          </button>
        </div>
      </form>

      {/* Historical Labour Musters */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
        <h3 className="text-sm font-bold text-vorq-ink mb-3">Audited Labour Muster History</h3>
        <div className="divide-y divide-slate-100">
          {labourMusters.map((muster) => (
            <div key={muster.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-vorq-ink font-mono">{muster.id}</span>
                  <span className="text-xs text-slate-600 font-medium">({muster.date})</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                    {muster.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Cost Code: {muster.linkedCostCode} • Headcount: {muster.totalWorkers} workers across {muster.entries.length} trades
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-vorq-ink font-tabular">
                  ₹ {muster.totalWages.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400">{muster.auditNote || 'Audited'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
