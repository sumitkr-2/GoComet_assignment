import React from 'react';
import { RFQStatus } from '../types';

interface StatusBadgeProps {
  status: RFQStatus;
  isExtended?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isExtended }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active Bidding
          {isExtended && (
            <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
              EXTENDED
            </span>
          )}
        </span>
      );
    case 'UPCOMING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Upcoming
        </span>
      );
    case 'FORCE_CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Force Closed
        </span>
      );
    case 'CLOSED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Closed
        </span>
      );
  }
};
