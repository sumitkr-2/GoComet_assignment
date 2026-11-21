import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { CircularCountdown } from '../components/CircularCountdown';
import { TiltCard3D } from '../components/TiltCard3D';
import {
  Gavel,
  CheckCircle2,
  TrendingDown,
  Layers,
  PlusCircle,
  ArrowRight,
  Activity,
  Sparkles,
  Truck,
  Shield,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';

export const DashboardPage: React.FC = () => {
  const { user, isBuyer } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000); // 2s live polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Synchronizing live procurement data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      {/* Welcome Hero Banner */}
      <TiltCard3D glowColor="indigo" intensity={5}>
        <div className="relative rounded-2xl p-6 sm:p-8 overflow-hidden glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 shadow-glass">
          {/* Neon gradient background aura */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 shadow-glow-cyan">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {user?.role} Procurement Space
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {user?.company_name || 'Enterprise Procurement Network'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                British Auction Reverse Bidding: Dynamic closing-time extensions ensure competitive price discovery without last-second sniping.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {isBuyer ? (
                <Link
                  to="/rfqs/new"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-bold text-xs shadow-glow-cyan transition-all duration-300"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New RFQ
                </Link>
              ) : (
                <Link
                  to="/auctions"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-emerald transition-all duration-300"
                >
                  <Gavel className="w-4 h-4" />
                  Compete in Auctions
                </Link>
              )}
            </div>
          </div>
        </div>
      </TiltCard3D>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total RFQ Auctions"
          value={stats?.total_auctions || 0}
          subtitle="All created RFQ events"
          icon={Layers}
          color="cyan"
        />
        <StatCard
          title="Active Auctions"
          value={stats?.active_auctions || 0}
          subtitle="Currently open for bids"
          icon={Gavel}
          trend={`${stats?.active_auctions || 0} Live Now`}
          trendType="positive"
          color="emerald"
        />
        <StatCard
          title="Total Submitted Bids"
          value={stats?.total_submitted_bids || 0}
          subtitle="Carrier competitive quotes"
          icon={TrendingDown}
          color="violet"
        />
        <StatCard
          title="Completed Auctions"
          value={stats?.completed_auctions || 0}
          subtitle={`${stats?.force_closed_auctions || 0} force closed`}
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Analytics Chart & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow-cyan" />
                7-Day Bidding & Extension Activity Curve
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time aggregate supplier quotations vs automatic extensions triggered
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-glow-cyan" /> Bids Submitted
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-glow-amber" /> Extensions
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.activity_chart_data || []}>
                <defs>
                  <linearGradient id="bidsGradNeon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="extGradNeon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-3.5 rounded-xl border border-white/20 shadow-glass text-xs font-sans text-white">
                          <p className="font-bold text-slate-200 mb-1">{label}</p>
                          <p className="text-cyan-400 font-bold">
                            Bids: {payload[0]?.value}
                          </p>
                          <p className="text-amber-400 font-bold">
                            Extensions: {payload[1]?.value}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bids_count"
                  name="Bids Submitted"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#bidsGradNeon)"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.35))' }}
                />
                <Area
                  type="monotone"
                  dataKey="extensions_count"
                  name="Extensions"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#extGradNeon)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Activity Stream */}
        <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Audit Activity
              </h2>
              <Link
                to="/activity"
                className="text-xs text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[270px] pr-1">
              {stats?.recent_activity.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No bidding activity recorded yet.
                </p>
              ) : (
                stats?.recent_activity.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs p-3 rounded-xl bg-slate-100/60 dark:bg-dark-850/60 border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5 transition-colors hover:border-cyan-500/30"
                  >
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        log.event_type === 'AUCTION_EXTENDED'
                          ? 'bg-amber-400 shadow-glow-amber animate-ping'
                          : log.event_type === 'RANKING_CHANGED'
                          ? 'bg-cyan-400 shadow-glow-cyan'
                          : 'bg-emerald-400 shadow-glow-emerald'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                        {log.event_description}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 text-[11px] text-slate-400 text-center font-mono">
            Reactive sync engine active (2s heartbeat)
          </div>
        </div>
      </div>

      {/* Active & Recent RFQs Table */}
      <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 shadow-glass overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-cyan-400" />
              Active & Recent RFQ Auctions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any auction row to enter the live 3D bidding room
            </p>
          </div>
          <Link
            to="/auctions"
            className="text-xs font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            All Auctions ({stats?.total_auctions}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/40 dark:bg-dark-850/60 border-b border-slate-200/60 dark:border-white/5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                <th className="py-3.5 px-4">RFQ Reference & Title</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Current L1 Lowest Bid</th>
                <th className="py-3.5 px-4">Suppliers / Bids</th>
                <th className="py-3.5 px-4">Closing Countdown</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {stats?.recent_rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => (window.location.href = `/rfqs/${rfq.id}`)}
                >
                  <td className="py-4 px-4">
                    <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 block">
                      {rfq.reference_id}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white group-hover:text-cyan-400 transition-colors block text-sm mt-0.5">
                      {rfq.name}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <StatusBadge status={rfq.status} isExtended={rfq.is_extended} />
                  </td>

                  <td className="py-4 px-4">
                    {rfq.current_lowest_bid ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            ₹{rfq.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase">
                            L1
                          </span>
                        </div>
                        {rfq.lowest_bidder_name && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-[140px] mt-0.5">
                            by {rfq.lowest_bidder_name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No bids yet</span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {rfq.total_suppliers_count} suppliers
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {rfq.total_bids_count} total bids
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <CircularCountdown
                      startTime={rfq.bid_start_time}
                      closeTime={rfq.current_close_time}
                      forcedCloseTime={rfq.forced_close_time}
                      status={rfq.status}
                      triggerWindowMinutes={rfq.auction_config?.trigger_window_minutes}
                      size="sm"
                    />
                  </td>

                  <td className="py-4 px-4 text-right">
                    <Link
                      to={`/rfqs/${rfq.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-sm"
                    >
                      Enter Room <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
