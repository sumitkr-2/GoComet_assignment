import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI } from '../services/api';
import { RFQ } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CircularCountdown } from '../components/CircularCountdown';
import { TiltCard3D } from '../components/TiltCard3D';
import {
  Search,
  PlusCircle,
  Gavel,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export const AuctionListPage: React.FC = () => {
  const { isBuyer } = useAuth();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchRfqs = async () => {
    try {
      const data = await rfqAPI.list(statusFilter, searchTerm);
      setRfqs(data);
    } catch (err) {
      console.error('Failed to list RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
    const interval = setInterval(fetchRfqs, 2000); // 2s live update
    return () => clearInterval(interval);
  }, [statusFilter, searchTerm]);

  const filterTabs = [
    { id: 'ALL', label: 'All Auctions' },
    { id: 'ACTIVE', label: 'Active Bidding' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'CLOSED', label: 'Closed' },
    { id: 'FORCE_CLOSED', label: 'Force Closed' },
  ];

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Gavel className="w-6 h-6 text-cyan-400" />
            British Auction Procurement RFQs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time reverse bidding auctions with automatic deadline extension logic
          </p>
        </div>

        {isBuyer && (
          <Link
            to="/rfqs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-cyan transition-all shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Create RFQ
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 p-4 shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-glow-cyan'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-cyan-500/70" />
          </div>
          <input
            type="text"
            placeholder="Search by title or reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* RFQ Table */}
      <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 shadow-glass overflow-hidden">
        {loading && rfqs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading auctions...</p>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Gavel className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No auctions match the criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or create a new RFQ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/40 dark:bg-dark-850/60 border-b border-slate-200/60 dark:border-white/5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-4">RFQ Identifier & Title</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Current Lowest Bid (L1)</th>
                  <th className="py-4 px-4">Closing Countdown</th>
                  <th className="py-4 px-4">Forced Close Limit</th>
                  <th className="py-4 px-4">Extension Config</th>
                  <th className="py-4 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {rfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => (window.location.href = `/rfqs/${rfq.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                          {rfq.reference_id}
                        </span>
                        {rfq.reference_id === 'RFQ-FAST-001' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[9px] font-black uppercase flex items-center gap-1 shadow-glow-amber">
                            <Sparkles className="w-2.5 h-2.5" /> FAST DEMO
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 group-hover:text-cyan-400 transition-colors">
                        {rfq.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Created by {rfq.buyer_name || 'Buyer'} • {rfq.total_suppliers_count} active suppliers
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={rfq.status} isExtended={rfq.is_extended} />
                    </td>

                    <td className="py-4 px-4">
                      {rfq.current_lowest_bid ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                              ₹{rfq.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black rounded text-[9px] uppercase">
                              L1
                            </span>
                          </div>
                          {rfq.lowest_bidder_name && (
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px] mt-0.5">
                              {rfq.lowest_bidder_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No bids yet</span>
                      )}
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
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {new Date(rfq.current_close_time).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        {new Date(rfq.forced_close_time).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-rose-400 block mt-0.5">
                        Hard Ceiling
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[11px]">
                      {rfq.auction_config?.british_auction_enabled ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {rfq.auction_config.extension_trigger_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-400 text-[10px] block font-mono">
                            Window: {rfq.auction_config.trigger_window_minutes}m • Extends: +{rfq.auction_config.extension_duration_minutes}m
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Standard Auction</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/rfqs/${rfq.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs transition-all shadow-sm"
                      >
                        Enter Auction <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
