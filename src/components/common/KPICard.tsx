import React from 'react';
import { ArrowUpRight, ArrowDownRight, ExternalLink, ShieldCheck, HelpCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  amount: number | null;
  taxBasis?: 'ex-tax' | 'inc-tax';
  deltaText?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  sourceDocCount?: number;
  sourceDocName?: string;
  asOfTime?: string;
  onDrilldown?: () => void;
  statusBadge?: string;
  isUnavailable?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  amount,
  taxBasis = 'ex-tax',
  deltaText,
  deltaType = 'neutral',
  sourceDocCount,
  sourceDocName = 'ERP Ledger Entries',
  asOfTime = 'Today, 17:30',
  onDrilldown,
  statusBadge,
  isUnavailable = false,
}) => {
  // Format to Indian Currency notation (₹ Lakhs or ₹ Crores)
  const formatIndianCurrency = (val: number | null): string => {
    if (val === null) return 'Unavailable';
    const isNegative = val < 0;
    const absVal = Math.abs(val);

    let formatted = '';
    if (absVal >= 10000000) {
      formatted = `₹ ${(absVal / 10000000).toFixed(2)} Cr`;
    } else if (absVal >= 100000) {
      formatted = `₹ ${(absVal / 100000).toFixed(2)} L`;
    } else {
      formatted = `₹ ${absVal.toLocaleString('en-IN')}`;
    }

    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="bg-vorq-surface border border-vorq-border rounded-vorq p-4 sm:p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-vorq-slate">
            {title}
          </span>
          {statusBadge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {statusBadge}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          {isUnavailable || amount === null ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="text-xl font-bold text-slate-400">Not Available</span>
              <span title="Awaiting reconciled data source from site" className="text-slate-400 cursor-help">
                <HelpCircle className="w-4 h-4" />
              </span>
            </div>
          ) : (
            <>
              <div className="text-2xl sm:text-3xl font-extrabold text-vorq-ink font-tabular tracking-tight">
                {formatIndianCurrency(amount)}
              </div>
              <span className="text-[11px] font-medium text-slate-400 uppercase">
                ({taxBasis})
              </span>
            </>
          )}
        </div>

        {deltaText && (
          <div className="flex items-center gap-1 text-xs mb-3">
            {deltaType === 'negative' ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-vorq-danger" />
            ) : deltaType === 'positive' ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-vorq-success" />
            ) : null}
            <span
              className={`font-medium ${
                deltaType === 'negative'
                  ? 'text-vorq-danger'
                  : deltaType === 'positive'
                  ? 'text-vorq-success'
                  : 'text-vorq-slate'
              }`}
            >
              {deltaText}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Traceable Lineage & Ledger Drilldown */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-vorq-slate">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-green-600" />
          <span className="truncate max-w-[130px]">
            {sourceDocCount !== undefined ? `${sourceDocCount} vouchers` : sourceDocName}
          </span>
        </div>
        
        {onDrilldown && amount !== null && !isUnavailable && (
          <button
            onClick={onDrilldown}
            className="text-vorq-primary hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
          >
            <span>Drilldown</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
