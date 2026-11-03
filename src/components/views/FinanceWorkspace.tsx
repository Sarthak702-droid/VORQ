import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Receipt, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  CreditCard,
  FileText
} from 'lucide-react';

export const FinanceWorkspace: React.FC = () => {
  const { clientInvoices, recordClientInvoicePayment, setActiveDrilldownModal } = useApp();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(500000);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = clientInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    recordClientInvoicePayment(selectedInvoiceId, Number(paymentAmount));
    setPaymentModalOpen(false);
    setFeedback(`Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} reconciled with ERPNext Bank Entry.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
            <Receipt className="w-6 h-6 text-vorq-primary" />
            Finance & Client Milestone Invoicing
          </h1>
          <p className="text-xs text-vorq-slate mt-0.5">
            ERPNext General Ledger reconciliation, statutory GST compliance, milestone billings and collections aging.
          </p>
        </div>

        <button
          onClick={() => setActiveDrilldownModal('Actual Posted Cost')}
          className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
        >
          <FileText className="w-4 h-4" />
          <span>Audit Full Ledger Lineage</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-vorq border bg-green-50 border-green-200 text-green-800 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Financial Receivables Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="text-xs font-semibold text-vorq-slate uppercase mb-1">Total Client Invoiced (Inc-Tax)</div>
          <div className="text-2xl font-extrabold text-vorq-ink font-tabular">
            ₹ {(totalInvoiced / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-slate-500 mt-1">3 Contract Milestones Billed with 18% GST</div>
        </div>

        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="text-xs font-semibold text-vorq-slate uppercase mb-1">Collections Realized</div>
          <div className="text-2xl font-extrabold text-green-700 font-tabular">
            ₹ {(totalCollected / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-green-800 mt-1 font-medium">Verified in Current Bank Account</div>
        </div>

        <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs">
          <div className="text-xs font-semibold text-vorq-slate uppercase mb-1">Outstanding Receivables</div>
          <div className="text-2xl font-extrabold text-vorq-primary font-tabular">
            ₹ {(totalOutstanding / 100000).toFixed(2)} Lakhs
          </div>
          <div className="text-xs text-amber-700 mt-1 font-medium">Includes ₹18.66 Lakhs aged 19 days</div>
        </div>
      </div>

      {/* Client Milestone Invoices Table */}
      <div className="bg-white border border-vorq-border rounded-vorq shadow-xs overflow-hidden">
        <div className="p-4 border-b border-vorq-border flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-vorq-ink">Client Milestone Invoices (ERPNext Sales Invoices)</h3>
            <p className="text-xs text-vorq-slate">Immutable document cross-reference to site measurement stages and GST basis</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-vorq-border text-left text-xs">
            <thead className="bg-slate-100 text-vorq-slate font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Milestone Scope</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Tax Base (₹)</th>
                <th className="py-2.5 px-3 text-right">18% GST (₹)</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-3 text-right">Collected (₹)</th>
                <th className="py-2.5 px-3">ERP Sales Inv</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {clientInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono font-bold text-vorq-primary">{inv.invoiceNo}</td>
                  <td className="py-3 px-3 font-medium text-vorq-ink max-w-xs">{inv.milestoneTitle}</td>
                  <td className="py-3 px-3 text-slate-600">{inv.issueDate}</td>
                  <td className="py-3 px-3 text-slate-600">{inv.dueDate}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800 font-tabular">
                    ₹ {inv.grossAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 font-tabular">
                    ₹ {inv.gstAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-vorq-ink font-tabular">
                    ₹ {inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-green-700 font-tabular">
                    ₹ {inv.paidAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-blue-50 text-vorq-primary px-1.5 py-0.5 rounded border border-blue-200">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      {inv.erpSalesInvoiceRef}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inv.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      inv.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => {
                          setSelectedInvoiceId(inv.id);
                          setPaymentAmount(inv.totalAmount - inv.paidAmount);
                          setPaymentModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-vorq-primary text-white text-[11px] font-semibold rounded hover:bg-blue-700 transition"
                      >
                        Record Collection
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Record Client Payment Realization</h3>
            <p className="text-slate-500 mb-4">Post bank receipt voucher into ERPNext with real-time GL reconciliation.</p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  min="1000"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bank Payment Mode</label>
                <select className="w-full px-3 py-2 border border-vorq-border rounded-lg bg-slate-50">
                  <option value="neft">NEFT / RTGS Bank Transfer</option>
                  <option value="cheque">Client CTS Cheque</option>
                  <option value="upi">Direct Corporate UPI</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
                >
                  Reconcile Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
