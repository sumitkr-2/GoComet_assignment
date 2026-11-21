import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { ActivityLog } from '../types';
import { History, Sparkles, Filter, Search, ArrowRight, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ActivityHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const fetchLogs = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setLogs(data.recent_activity || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'EXTENSIONS') return log.event_type === 'AUCTION_EXTENDED';
    if (filterType === 'BIDS') return log.event_type === 'BID_SUBMITTED' || log.event_type === 'BID_UPDATED';
    if (filterType === 'RANKINGS') return log.event_type === 'RANKING_CHANGED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          Procurement Audit & Activity Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological audit trail of all bid submissions, leaderboard ranking shifts, extensions, and auction closures
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'EXTENSIONS', 'BIDS', 'RANKINGS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f === 'ALL' ? 'All Events' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No activity logs recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      log.event_type === 'AUCTION_EXTENDED'
                        ? 'bg-amber-100 text-amber-800'
                        : log.event_type === 'RANKING_CHANGED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : log.event_type === 'AUCTION_FORCE_CLOSED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {log.event_type === 'AUCTION_EXTENDED' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Gavel className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                      {log.supplier_company_name && (
                        <span className="text-[11px] font-semibold text-slate-600">
                          • {log.supplier_company_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                      {log.event_description}
                    </p>
                    {log.previous_close_time && log.updated_close_time && (
                      <div className="text-[11px] font-mono text-indigo-600">
                        Deadline Extension: {new Date(log.previous_close_time).toLocaleTimeString()} &rarr;{' '}
                        {new Date(log.updated_close_time).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <Link
                    to={`/rfqs/${log.rfq_id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 mt-1"
                  >
                    View RFQ #{log.rfq_id} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
