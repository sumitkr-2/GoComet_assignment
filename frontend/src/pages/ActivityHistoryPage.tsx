import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { ActivityLog } from '../types';
import { History, Sparkles, Gavel, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    const interval = setInterval(fetchLogs, 2500);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'EXTENSIONS') return log.event_type === 'AUCTION_EXTENDED';
    if (filterType === 'BIDS') return log.event_type === 'BID_SUBMITTED' || log.event_type === 'BID_UPDATED';
    if (filterType === 'RANKINGS') return log.event_type === 'RANKING_CHANGED';
    return true;
  });

  return (
    <div className="space-y-6 relative z-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <History className="w-6 h-6 text-cyan-400" />
          Procurement Audit & Live Timeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Chronological audit trail of all bid submissions, leaderboard ranking shifts, extensions, and auction closures
        </p>
      </div>

      <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 p-4 shadow-glass flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['ALL', 'EXTENSIONS', 'BIDS', 'RANKINGS'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                filterType === f
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-glow-cyan'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All Events' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 shadow-glass overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity logs recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                      log.event_type === 'AUCTION_EXTENDED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-glow-amber'
                        : log.event_type === 'RANKING_CHANGED'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                        : log.event_type === 'AUCTION_FORCE_CLOSED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {log.event_type === 'AUCTION_EXTENDED' ? (
                      <Sparkles className="w-4 h-4 animate-spin" />
                    ) : (
                      <Gavel className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {log.event_type.replace(/_/g, ' ')}
                      </span>
                      {log.supplier_company_name && (
                        <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                          • {log.supplier_company_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                      {log.event_description}
                    </p>
                    {log.previous_close_time && log.updated_close_time && (
                      <div className="text-[11px] font-mono text-cyan-500 dark:text-cyan-400 font-bold">
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-500 hover:text-cyan-400 mt-1"
                  >
                    View RFQ #{log.rfq_id} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
