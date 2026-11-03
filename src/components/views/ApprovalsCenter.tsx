import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Clock, 
  ShieldCheck,
  Filter
} from 'lucide-react';
import { ApprovalItem } from '../../types';

export const ApprovalsCenter: React.FC = () => {
  const { approvals, handleApprovalAction, currentRole } = useApp();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [rejectModalItem, setRejectModalItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredApprovals = approvals.filter(item => {
    if (activeFilter === 'All') return true;
    return item.status === activeFilter;
  });

  const handleApprove = (item: ApprovalItem) => {
    handleApprovalAction(item.id, 'Approve');
    setFeedback(`Approved ${item.type} (${item.referenceNo}). Linked documents updated.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    handleApprovalAction(rejectModalItem.id, 'Reject', rejectReason);
    setRejectModalItem(null);
    setRejectReason('');
    setFeedback(`Rejected ${rejectModalItem.type} (${rejectModalItem.referenceNo}). Reason logged in audit trail.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-vorq-ink flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-vorq-primary" />
            Unified Authorization & Approval Inbox
          </h1>
          <p className="text-xs text-vorq-slate mt-0.5">
            Maker-checker policy enforcement across Purchase Orders, Subcontract RA Bills, Material Requests and BOQ Baselines.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-md transition ${
                activeFilter === tab 
                  ? 'bg-white text-vorq-primary shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-vorq-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-vorq border bg-blue-50 border-blue-200 text-blue-900 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-vorq-primary shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white border border-vorq-border rounded-vorq p-8 text-center">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No {activeFilter} Approvals in Queue</h4>
            <p className="text-xs text-slate-400 mt-1">All transactional items in this stage have been authorized.</p>
          </div>
        ) : (
          filteredApprovals.map((item) => (
            <div 
              key={item.id} 
              className="bg-white border border-vorq-border rounded-vorq p-5 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.type}
                  </span>
                  <span className="font-mono text-xs font-semibold text-vorq-primary">
                    {item.referenceNo}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    item.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-vorq-ink">
                  {item.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-vorq-slate">
                  <span>Project: <strong className="text-slate-700">{item.projectName}</strong></span>
                  <span>Requested By: <strong className="text-slate-700">{item.requestedBy}</strong></span>
                  <span>Timestamp: <strong className="text-slate-700">{item.requestedAt}</strong></span>
                </div>

                {/* Budget impact note */}
                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-100 flex items-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Budget Impact: </span>
                    <span>{item.budgetImpact}</span>
                  </div>
                </div>

                {item.auditReason && (
                  <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                    <strong>Rejection Reason: </strong>{item.auditReason}
                  </div>
                )}
              </div>

              {/* Right: Amount & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                {item.amount !== null && (
                  <div className="text-left md:text-right">
                    <div className="text-xs text-slate-400 uppercase font-medium">Financial Impact</div>
                    <div className="text-base sm:text-lg font-extrabold text-vorq-ink font-tabular">
                      ₹ {item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}

                {item.status === 'Pending' && ['Owner', 'ProjectManager'].includes(currentRole) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRejectModalItem(item)}
                      className="px-3 py-1.5 bg-red-50 text-vorq-danger border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Authorize</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-vorq shadow-xl border border-vorq-border w-full max-w-md p-5 text-xs">
            <h3 className="text-base font-bold text-vorq-ink mb-1">Reject Authorization Request</h3>
            <p className="text-slate-500 mb-3">
              Provide an auditable reason for rejecting {rejectModalItem.referenceNo}. The requester will be notified.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Rejection Reason</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Rate exceeds baseline rate master; revision required."
                  className="w-full px-3 py-2 border border-vorq-border rounded-lg focus:ring-1 focus:ring-vorq-danger"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-vorq-danger text-white font-semibold rounded-lg hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
