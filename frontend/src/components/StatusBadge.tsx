import React from 'react';
import { RFQStatus } from '../types';
import { Sparkles, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: RFQStatus;
  isExtended?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isExtended }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-glow-emerald">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Active Bidding
          {isExtended && (
            <span className="ml-1 px-1.5 py-0.2 bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-violet-400" />
              EXTENDED
            </span>
          )}
        </span>
      );
    case 'UPCOMING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-glow-amber">
          <Clock className="w-3.5 h-3.5" />
          Upcoming
        </span>
      );
    case 'FORCE_CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-glow-rose">
          <ShieldAlert className="w-3.5 h-3.5" />
          Force Closed
        </span>
      );
    case 'CLOSED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Closed
        </span>
      );
  }
};
