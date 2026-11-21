import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  Gavel,
  CheckCircle2,
  TrendingDown,
  Layers,
  Users,
  PlusCircle,
  ArrowRight,
  Clock,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

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
    const interval = setInterval(fetchStats, 3000); // 3s real-time polling
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading live procurement statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
                {user?.role} PORTAL
              </span>
              <span className="text-xs text-slate-400">
                {user?.company_name || 'Procurement Operations'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              British Auction Reverse Bidding: Automated closing-time extensions ensure dynamic, fair competition.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isBuyer ? (
              <Link
                to="/rfqs/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Create New RFQ
              </Link>
            ) : (
              <Link
                to="/auctions"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all shrink-0"
              >
                <Gavel className="w-4 h-4" />
                View Active Auctions
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total RFQ Auctions"
          value={stats?.total_auctions || 0}
          subtitle="All created RFQ events"
          icon={Layers}
          color="blue"
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
          title="Total Bids Submitted"
          value={stats?.total_submitted_bids || 0}
          subtitle="Competitive supplier quotes"
          icon={TrendingDown}
          color="indigo"
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">7-Day Bidding & Extension Activity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time aggregate supplier bids and triggered extensions</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-indigo-500" /> Bids Submitted
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-full bg-amber-400" /> Extensions Triggered
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.activity_chart_data || []}>
                <defs>
                  <linearGradient id="bidsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="extGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="bids_count" name="Bids Submitted" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#bidsGrad)" />
                <Area type="monotone" dataKey="extensions_count" name="Extensions" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#extGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Activity Stream */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Live Audit Activity
              </h2>
              <Link to="/activity" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[260px] pr-1">
              {stats?.recent_activity.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No bidding activity recorded yet.</p>
              ) : (
                stats?.recent_activity.map((log) => (
                  <div key={log.id} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        log.event_type === 'AUCTION_EXTENDED'
                          ? 'bg-amber-500 animate-ping'
                          : log.event_type === 'RANKING_CHANGED'
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-800 truncate">
                          {log.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2 leading-tight">
                        {log.event_description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Automatic background sync active (2s interval)
          </div>
        </div>
      </div>

      {/* Recent RFQs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Active & Recent RFQ Auctions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any row to open the live auction bidding room</p>
          </div>
          <Link
            to="/auctions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            All Auctions ({stats?.total_auctions}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">RFQ Reference & Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current L1 Lowest Bid</th>
                <th className="py-3 px-4">Suppliers / Bids</th>
                <th className="py-3 px-4">Closing Time / Countdown</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stats?.recent_rfqs.map((rfq) => (
                <tr
                  key={rfq.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => (window.location.href = `/rfqs/${rfq.id}`)}
                >
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-bold text-indigo-600 block">
                      {rfq.reference_id}
                    </span>
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors block">
                      {rfq.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={rfq.status} isExtended={rfq.is_extended} />
                  </td>
                  <td className="py-3.5 px-4">
                    {rfq.current_lowest_bid ? (
                      <div>
                        <span className="font-mono font-bold text-emerald-600 text-sm">
                          ₹{rfq.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {rfq.lowest_bidder_name && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                            by {rfq.lowest_bidder_name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No bids yet</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-700">
                      {rfq.total_suppliers_count} suppliers
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {rfq.total_bids_count} total bids
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <CountdownTimer
                      closeTime={rfq.current_close_time}
                      status={rfq.status}
                      triggerWindowMinutes={rfq.auction_config?.trigger_window_minutes}
                      compact={true}
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Closes: {new Date(rfq.current_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/rfqs/${rfq.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-semibold text-xs transition-colors"
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
