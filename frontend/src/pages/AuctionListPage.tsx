import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI } from '../services/api';
import { RFQ, RFQStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  Search,
  Filter,
  PlusCircle,
  Gavel,
  ArrowRight,
  TrendingDown,
  Clock,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-600" />
            British Auction RFQs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time reverse bidding auctions with automatic deadline extension logic
          </p>
        </div>

        {isBuyer && (
          <Link
            to="/rfqs/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Create RFQ
          </Link>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by RFQ name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* RFQ Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && rfqs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Fetching auctions...</p>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Gavel className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold">No auctions found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search criteria or create a new RFQ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">RFQ Identifier & Title</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Lowest Bid (L1)</th>
                  <th className="py-3.5 px-4">Current Close Time</th>
                  <th className="py-3.5 px-4">Forced Close Limit</th>
                  <th className="py-3.5 px-4">Extension Config</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {rfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => (window.location.href = `/rfqs/${rfq.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 text-xs">
                          {rfq.reference_id}
                        </span>
                        {rfq.reference_id === 'RFQ-FAST-001' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> FAST DEMO
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm mt-0.5 group-hover:text-indigo-600 transition-colors">
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
                            <span className="font-mono font-bold text-emerald-600 text-base">
                              ₹{rfq.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                              L1
                            </span>
                          </div>
                          {rfq.lowest_bidder_name && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-[140px] mt-0.5">
                              {rfq.lowest_bidder_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No bids yet</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <CountdownTimer
                        closeTime={rfq.current_close_time}
                        status={rfq.status}
                        triggerWindowMinutes={rfq.auction_config?.trigger_window_minutes}
                        compact={true}
                      />
                      <span className="text-[11px] text-slate-500 font-mono block mt-1">
                        {new Date(rfq.current_close_time).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
                      <span className="flex items-center gap-1 text-slate-700">
                        <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(rfq.forced_close_time).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Hard Ceiling
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[11px]">
                      {rfq.auction_config?.british_auction_enabled ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-800 block">
                            Trigger: {rfq.auction_config.extension_trigger_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-slate-500 text-[10px] block">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 font-semibold text-xs transition-all shadow-sm"
                      >
                        Enter Auction <ArrowRight className="w-3 h-3" />
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
