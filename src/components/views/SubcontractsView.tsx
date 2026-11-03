import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Layers, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Receipt,
  Lock
} from 'lucide-react';
import { SubcontractBill } from '../../types';

export const SubcontractsView: React.FC = () => {
  const { 
    subcontracts, 
    subcontractBills, 
    submitSubcontractBill, 
    approveSubcontractBill, 
    currentRole, 
    currentProject 
  } = useApp();

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState(subcontracts[0]?.id || '');
  const [period, setPeriod] = useState('RA Bill #4 (01 Nov - 15 Nov 2026)');
  const [currentGross, setCurrentGross] = useState<number>(85000);
  const [advanceDeduction, setAdvanceDeduction] = useState<number>(10000);
  const [otherDeduction, setOtherDeduction] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedAgreement = subcontracts.find(s => s.id === selectedAgreementId) || subcontracts[0];
  const retentionDeduction = (currentGross * (selectedAgreement?.retentionPercent || 5.0)) / 100;
  const netPayable = currentGross - retentionDeduction - advanceDeduction - otherDeduction;

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement) return;

    submitSubcontractBill({
      agreementId: selectedAgreement.id,
      contractNo: selectedAgreement.contractNo,
      projectId: currentProject.id,
      subcontractorName: selectedAgreement.subcontractorName,
      period,
      cumulativeMeasured: 480000,
      previousCertified: 395000,
      currentGrossMeasured: currentGross,
      retentionDeduction,
      advanceRecoveryDeduction: advanceDeduction,
      otherDeductions: otherDeduction,
      netPayable,
      submittedDate: new Date().toISOString().split('T')[0]
    });

    setIsSubmitModalOpen(false);
    setFeedback('Measured RA Bill submitted for QS verification and owner approval.');
    setTimeout(() => setFeedback(null), 4000);
  };

  // If role is external Subcontractor, restrict view to only their agreement
  const displayedAgreements = currentRole === 'Subcontractor' 
    ? subcontracts.slice(0, 1) 
    : subcontracts;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
            <Layers className="w-6 h-6 text-vorq-primary" />
            Subcontracts & Measured RA Billing
          </h1>
          <p className="text-xs text-vorq-slate mt-0.5">
            Schedule of values, cumulative measurement books, retention waterfall and ERP Purchase Invoices.
          </p>
        </div>

        {['Owner', 'QuantitySurveyor', 'ProjectManager'].includes(currentRole) && (
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-3.5 py-2 bg-vorq-primary text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Measured RA Bill</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-4 rounded-vorq border bg-green-50 border-green-200 text-green-800 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Active Subcontract Agreements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedAgreements.map((sc) => (
          <div key={sc.id} className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-vorq-primary bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {sc.contractNo}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                  {sc.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-vorq-ink">{sc.subcontractorName}</h3>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{sc.trade}</div>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{sc.scopeOfWork}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Contract Value</div>
                <div className="font-bold text-vorq-ink font-tabular">₹ {(sc.contractValue / 1000).toFixed(0)}k</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Retention %</div>
                <div className="font-bold text-vorq-primary font-tabular">{sc.retentionPercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Advance Recovered</div>
                <div className="font-bold text-slate-700 font-tabular">₹ {sc.advanceRecovered.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Measured RA Bills Ledger */}
      <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
        <div className="p-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-vorq-ink">Audited Subcontract RA Bills & Retention Waterfall</h3>
            <p className="text-xs text-vorq-slate">
              Net payable = Gross Measured &minus; 5% Retention &minus; Advance Recovery. Linked idempotently to ERPNext Purchase Invoice.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
            <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Bill #</th>
                <th className="py-2.5 px-3">Subcontractor</th>
                <th className="py-2.5 px-3">Billing Period</th>
                <th className="py-2.5 px-3 text-right">Gross Work (₹)</th>
                <th className="py-2.5 px-3 text-right">Retention (₹)</th>
                <th className="py-2.5 px-3 text-right">Advance Settled (₹)</th>
                <th className="py-2.5 px-3 text-right">Net Payable (₹)</th>
                <th className="py-2.5 px-3">ERP Voucher</th>
                <th className="py-2.5 px-3">Status</th>
                {['Owner', 'Accountant'].includes(currentRole) && (
                  <th className="py-2.5 px-3 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {subcontractBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{b.billNo}</td>
                  <td className="py-3 px-3 font-medium text-vorq-ink">{b.subcontractorName}</td>
                  <td className="py-3 px-3 text-slate-600">{b.period}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800 font-tabular">
                    ₹ {b.currentGrossMeasured.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-vorq-danger font-medium font-tabular">
                    &minus; ₹ {b.retentionDeduction.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-tabular">
                    &minus; ₹ {b.advanceRecoveryDeduction.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-vorq-ink font-tabular">
                    ₹ {b.netPayable.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {b.linkedPurchaseInvoiceNo ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">
                        <ShieldCheck className="w-3 h-3 text-green-600" />
                        {b.linkedPurchaseInvoiceNo}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Pending ERP Post</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      b.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  {['Owner', 'Accountant'].includes(currentRole) && (
                    <td className="py-3 px-3 text-center">
                      {b.status !== 'Approved' && (
                        <button
                          onClick={() => approveSubcontractBill(b.id)}
                          className="px-2.5 py-1 bg-green-600 text-white text-[11px] font-semibold rounded hover:bg-green-700 transition"
                        >
                          Approve & Post GL
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit RA Bill Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-lg p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Submit Subcontractor RA Measurement Bill</h3>
            <p className="text-slate-500 mb-4">Compute certified measurement, retention and net payable.</p>

            <form onSubmit={handleSubmitBill} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subcontract Agreement</label>
                <select
                  value={selectedAgreementId}
                  onChange={(e) => setSelectedAgreementId(e.target.value)}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50"
                >
                  {subcontracts.map(s => (
                    <option key={s.id} value={s.id}>{s.contractNo} - {s.subcontractorName} ({s.trade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Period / RA #</label>
                <input
                  type="text"
                  required
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Gross Measured (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={currentGross}
                    onChange={(e) => setCurrentGross(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Advance Recovery (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={advanceDeduction}
                    onChange={(e) => setAdvanceDeduction(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-vorq-border rounded-lg"
                  />
                </div>
              </div>

              {/* Waterfall Summary Panel */}
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Measured Work:</span>
                  <span className="font-bold text-slate-800">₹ {currentGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-vorq-danger">
                  <span>5% Security Retention:</span>
                  <span className="font-bold">&minus; ₹ {retentionDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Recovery:</span>
                  <span className="font-bold">&minus; ₹ {advanceDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-vorq-ink">
                  <span>Net Certified Payable:</span>
                  <span className="text-vorq-primary">₹ {netPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-vorq-primary text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
