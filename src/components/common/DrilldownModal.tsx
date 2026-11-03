import React from 'react';
import { X, ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { SourceDocumentDrilldown } from '../../types';

interface DrilldownModalProps {
  title: string;
  category: string;
  records: SourceDocumentDrilldown[];
  onClose: () => void;
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  title,
  category,
  records,
  onClose
}) => {
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-vorq shadow-2xl border border-vorq-border w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-vorq-primary" />
              <h3 className="text-base font-bold text-vorq-ink">
                Source Document Drilldown: {title}
              </h3>
            </div>
            <p className="text-xs text-vorq-slate mt-0.5">
              Auditable transaction lineage verified from Frappe/ERPNext general ledger & inventory entries.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto p-6">
          <div className="border border-vorq-border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
              <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Voucher Type & #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Cost Code</th>
                  <th className="py-2.5 px-3">Party / Beneficiary</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No underlying vouchers recorded for this category yet.
                    </td>
                  </tr>
                ) : (
                  records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-3 font-medium text-vorq-ink whitespace-nowrap">
                        <span className="text-[10px] block text-slate-400 uppercase font-mono">{r.voucherType}</span>
                        <span className="font-semibold text-vorq-primary">{r.voucherNo}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {r.costCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-vorq-ink font-medium max-w-[150px] truncate">{r.party}</td>
                      <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">{r.description}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular whitespace-nowrap">
                        ₹ {r.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-vorq-border font-bold">
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-right uppercase text-vorq-slate">
                    Total Reconciled Ledger Amount:
                  </td>
                  <td className="py-3 px-3 text-right text-vorq-ink text-sm font-tabular">
                    ₹ {totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-vorq-border bg-slate-50 flex items-center justify-between text-xs text-vorq-slate">
          <span>Target Tenant Database: <strong className="text-slate-800">MariaDB `site_utkal_infra`</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-vorq-primary text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Close Drilldown
          </button>
        </div>

      </div>
    </div>
  );
};
