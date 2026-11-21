import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rfqAPI, biddingAPI, rankingAPI, activityAPI } from '../services/api';
import { RFQ, Quotation, RFQRankings, ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { CircularCountdown } from '../components/CircularCountdown';
import { StatCard } from '../components/StatCard';
import { BidHistoryChart } from '../components/BidHistoryChart';
import { ExtensionToast, fireConfetti } from '../components/ExtensionToast';
import { TiltCard3D } from '../components/TiltCard3D';
import {
  Gavel,
  Clock,
  TrendingDown,
  ShieldAlert,
  ArrowLeft,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  History,
  Truck,
  Award,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const rfqId = Number(id);
  const { user, isSupplier } = useAuth();

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [rankings, setRankings] = useState<RFQRankings | null>(null);
  const [bids, setBids] = useState<Quotation[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Supplier Bid Form State
  const [carrierName, setCarrierName] = useState('');
  const [freightCharges, setFreightCharges] = useState<number | ''>('');
  const [originCharges, setOriginCharges] = useState<number | ''>('');
  const [destinationCharges, setDestinationCharges] = useState<number | ''>('');
  const [transitTime, setTransitTime] = useState('2 Business Days');
  const [quoteValidity, setQuoteValidity] = useState('15 Days');

  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const [bidSuccess, setBidSuccess] = useState<string | null>(null);

  // Expanded row tracking
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'extension' | 'l1_change';
  }>({ show: false, title: '', message: '', type: 'extension' });

  // Auto-calculated total quotation
  const totalQuotation =
    (Number(freightCharges) || 0) +
    (Number(originCharges) || 0) +
    (Number(destinationCharges) || 0);

  // Find user's existing best quotation
  const myExistingQuotes = bids.filter((b) => b.supplier_id === user?.supplier_id);
  const myBestQuote =
    myExistingQuotes.length > 0
      ? Math.min(...myExistingQuotes.map((q) => q.total_amount))
      : null;

  const currentL1Bid = rankings?.current_lowest_bid || null;

  const fetchAllData = async () => {
    if (!rfqId) return;
    try {
      const [rfqData, rankData, bidsData, actData] = await Promise.all([
        rfqAPI.getById(rfqId),
        rankingAPI.getRankings(rfqId),
        biddingAPI.getBids(rfqId),
        activityAPI.getLogs(rfqId),
      ]);

      // Check if closing time changed (extension occurred)
      if (rfq && rfqData.current_close_time !== rfq.current_close_time) {
        setToast({
          show: true,
          title: 'Auction Deadline Extended! ⚡',
          message: `Closing time extended to ${new Date(rfqData.current_close_time).toLocaleTimeString()} due to qualifying activity in trigger window.`,
          type: 'extension',
        });
      }

      // Check if L1 changed
      if (
        rankings &&
        rankData.l1_supplier_id &&
        rankings.l1_supplier_id &&
        rankData.l1_supplier_id !== rankings.l1_supplier_id
      ) {
        setToast({
          show: true,
          title: 'New L1 Leaderboard Champion! 🏆',
          message: `${rankData.l1_company_name} is now L1 with bid of ₹${rankData.current_lowest_bid?.toLocaleString('en-IN')}`,
          type: 'l1_change',
        });
      }

      setRfq(rfqData);
      setRankings(rankData);
      setBids(bidsData);
      setActivityLogs(actData);
    } catch (err) {
      console.error('Error polling auction details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 2000); // 2-second real-time polling
    return () => clearInterval(interval);
  }, [rfqId]);

  // Quick underbid helper
  const handleQuickDecrement = (reduction: number) => {
    const target = myBestQuote ? myBestQuote - reduction : (currentL1Bid ? currentL1Bid - reduction : 40000);
    const safeTarget = Math.max(1000, target);

    // Split target into realistic charges (75% freight, 15% origin, 10% dest)
    const freight = Math.round((safeTarget * 0.75) / 100) * 100;
    const origin = Math.round((safeTarget * 0.15) / 100) * 100;
    const dest = Math.max(100, safeTarget - freight - origin);

    setFreightCharges(freight);
    setOriginCharges(origin);
    setDestinationCharges(dest);
    if (!carrierName && user?.company_name) {
      setCarrierName(`${user.company_name} Prime`);
    }
  };

  const toggleRowExpand = (suppId: number) => {
    setExpandedRows((prev) => ({ ...prev, [suppId]: !prev[suppId] }));
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);

    if (totalQuotation <= 0) {
      setBidError('Total quotation must be greater than ₹0.00');
      return;
    }

    if (myBestQuote !== null && totalQuotation >= myBestQuote) {
      setBidError(
        `Reverse auction rule: Your new bid (₹${totalQuotation.toLocaleString()}) must be lower than your current best bid (₹${myBestQuote.toLocaleString()}).`
      );
      return;
    }

    setBidSubmitting(true);
    try {
      const res = await biddingAPI.submitBid(rfqId, {
        carrier_name: carrierName || `${user?.company_name || 'Carrier'} Express`,
        freight_charges: Number(freightCharges),
        origin_charges: Number(originCharges),
        destination_charges: Number(destinationCharges),
        transit_time: transitTime,
        quote_validity: quoteValidity,
      });

      if (res.is_l1) {
        fireConfetti();
      }

      let msg = `Quotation submitted! You are currently ranked ${res.rank}.`;
      if (res.auction_extended) {
        msg += ` ⚡ British Auction Extended to ${new Date(res.new_close_time).toLocaleTimeString()}!`;
        setToast({
          show: true,
          title: 'British Auction Extended! ⚡',
          message: res.extension_reason || `Closing time extended by trigger condition.`,
          type: 'extension',
        });
      }
      setBidSuccess(msg);
      setFreightCharges('');
      setOriginCharges('');
      setDestinationCharges('');
      fetchAllData();
    } catch (err: any) {
      setBidError(err.response?.data?.detail || 'Failed to submit bid.');
    } finally {
      setBidSubmitting(false);
    }
  };

  if (loading && !rfq) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Entering live 3D auction bidding room...
          </p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Auction not found.</p>
        <Link to="/auctions" className="text-cyan-400 font-bold text-xs mt-2 inline-block">
          &larr; Back to Auctions
        </Link>
      </div>
    );
  }

  const isBiddingActive = rfq.status === 'ACTIVE';

  return (
    <div className="space-y-6 relative z-10">
      <ExtensionToast
        show={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        title={toast.title}
        message={toast.message}
        type={toast.type}
      />

      {/* Top Breadcrumb & Live Heartbeat */}
      <div className="flex items-center justify-between">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Auctions
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/40 dark:bg-dark-850/60 border border-slate-200 dark:border-white/10 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Live Bidding Sync Active</span>
        </div>
      </div>

      {/* Main Auction Showcase Banner */}
      <TiltCard3D glowColor="cyan" intensity={4}>
        <div className="relative rounded-2xl p-6 sm:p-8 glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 shadow-glass overflow-hidden">
          {/* Subtle neon glow orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 shadow-sm">
                  {rfq.reference_id}
                </span>
                <StatusBadge status={rfq.status} isExtended={rfq.is_extended} />
                {rfq.auction_config?.british_auction_enabled && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    British Auction: {rfq.auction_config.extension_trigger_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {rfq.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Pickup Date:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {new Date(rfq.pickup_service_date).toLocaleDateString()}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Buyer:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {rfq.buyer_name || 'Procurement Team'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Total Quotations:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {bids.length}
                  </strong>
                </span>
              </div>
            </div>

            {/* Circular Countdown Gauge */}
            <div className="min-w-[320px]">
              <CircularCountdown
                startTime={rfq.bid_start_time}
                closeTime={rfq.current_close_time}
                forcedCloseTime={rfq.forced_close_time}
                status={rfq.status}
                isExtended={rfq.is_extended}
                triggerWindowMinutes={rfq.auction_config?.trigger_window_minutes}
                onExpire={fetchAllData}
                size="md"
              />
            </div>
          </div>

          {/* Extension Notice Alert */}
          {rfq.is_extended && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-800 dark:text-violet-200 text-xs flex items-start gap-3 shadow-sm"
            >
              <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="font-bold text-sm">
                  British Auction Automatic Extension Activated!
                </p>
                <p className="text-violet-700 dark:text-violet-300 text-xs mt-1 leading-relaxed">
                  Qualifying bidding activity occurred within the configured trigger window. 
                  Closing deadline dynamically pushed from{' '}
                  <span className="line-through opacity-70">
                    {new Date(rfq.original_close_time).toLocaleTimeString()}
                  </span>{' '}
                  to{' '}
                  <strong className="text-cyan-400 font-mono">
                    {new Date(rfq.current_close_time).toLocaleTimeString()}
                  </strong>
                  . Hard forced ceiling:{' '}
                  <strong className="text-rose-400 font-mono">
                    {new Date(rfq.forced_close_time).toLocaleTimeString()}
                  </strong>
                  .
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </TiltCard3D>

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Lowest Bid (L1)"
          value={
            rankings?.current_lowest_bid
              ? `₹${rankings.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              : 'No Bids Yet'
          }
          subtitle={
            rankings?.l1_company_name
              ? `Held by ${rankings.l1_company_name}`
              : 'Awaiting first quotation'
          }
          icon={TrendingDown}
          color="emerald"
        />
        <StatCard
          title="Participating Suppliers"
          value={rankings?.total_suppliers || 0}
          subtitle="Active competing carriers"
          icon={Truck}
          color="cyan"
        />
        <StatCard
          title="Current Close Time"
          value={new Date(rfq.current_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          subtitle={`Originally ${new Date(rfq.original_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          icon={Clock}
          color="violet"
        />
        <StatCard
          title="Forced Close Limit"
          value={new Date(rfq.forced_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          subtitle="Hard ceiling limit"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Main Grid: Leaderboard & Quotation Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Leaderboard & Live Bid History Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Leaderboard */}
          <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 shadow-glass overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Live Supplier Leaderboard (Rankings)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lowest total quotation holds L1 position (Reverse Auction)
                </p>
              </div>
              <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full font-mono">
                {rankings?.rankings.length || 0} Active Quotes
              </span>
            </div>

            <div className="overflow-x-auto">
              {rankings?.rankings.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  No quotations submitted yet. Competing carriers will appear here as bids arrive.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/40 dark:bg-dark-850/60 border-b border-slate-200/60 dark:border-white/5 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Supplier / Carrier</th>
                      <th className="py-3.5 px-4">Charges Breakdown</th>
                      <th className="py-3.5 px-4">Total Bid</th>
                      <th className="py-3.5 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                    {rankings?.rankings.map((item) => {
                      const isExpanded = !!expandedRows[item.supplier_id];
                      return (
                        <React.Fragment key={item.supplier_id}>
                          <tr
                            onClick={() => toggleRowExpand(item.supplier_id)}
                            className={`transition-colors cursor-pointer ${
                              item.rank === 'L1'
                                ? 'bg-emerald-500/10 dark:bg-emerald-500/10 hover:bg-emerald-500/15'
                                : item.is_current_user
                                ? 'bg-cyan-500/10 dark:bg-cyan-500/10 hover:bg-cyan-500/15'
                                : 'hover:bg-slate-50/50 dark:hover:bg-white/5'
                            }`}
                          >
                            <td className="py-4 px-4 font-mono">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs shadow-sm ${
                                  item.rank === 'L1'
                                    ? 'bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white shadow-glow-emerald ring-2 ring-emerald-400/50'
                                    : item.rank === 'L2'
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {item.rank}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {item.company_name}
                                </span>
                                {item.is_current_user && (
                                  <span className="px-2 py-0.5 bg-cyan-500 text-black font-black rounded-md text-[9px] uppercase tracking-wider shadow-sm">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Truck className="w-3 h-3 text-cyan-400" />
                                {item.carrier_name}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              <div>Freight: ₹{item.freight_charges.toLocaleString()}</div>
                              <div className="text-[10px] text-slate-400">
                                Origin: ₹{item.origin_charges.toLocaleString()} • Dest: ₹{item.destination_charges.toLocaleString()}
                              </div>
                            </td>

                            <td className="py-4 px-4 font-mono">
                              <span
                                className={`font-black text-base ${
                                  item.rank === 'L1'
                                    ? 'text-emerald-500 dark:text-emerald-400'
                                    : 'text-slate-800 dark:text-white'
                                }`}
                              >
                                ₹{item.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable details row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr className="bg-slate-50/70 dark:bg-dark-850/50">
                                <td colSpan={5} className="p-4">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
                                  >
                                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/5">
                                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Transit SLA</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.transit_time}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/5">
                                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Quote Validity</span>
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.quote_validity}</span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/5">
                                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Submitted At</span>
                                      <span className="font-mono text-slate-800 dark:text-slate-200">
                                        {new Date(item.submitted_at).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/5">
                                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Tie-Break Priority</span>
                                      <span className="font-mono text-emerald-500 font-bold">Deterministic</span>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Live Price Trend Chart */}
          <div className="rounded-2xl glass-panel dark:bg-dark-900/70 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass">
            <BidHistoryChart bids={bids} />
          </div>
        </div>

        {/* Right Column: Bid Submission Form & Activity Stream */}
        <div className="space-y-6">
          {/* Supplier Quotation Submission Form */}
          {isSupplier ? (
            <div className="rounded-2xl glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass space-y-4">
              <div className="border-b border-slate-200/60 dark:border-white/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-cyan-400" />
                    Submit / Lower Quotation
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reverse Bidding: Each bid must be lower than your previous quote
                  </p>
                </div>
              </div>

              {myBestQuote !== null && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-800 dark:text-cyan-300 flex items-center justify-between shadow-sm">
                  <span className="font-bold">Your Current Best Bid:</span>
                  <strong className="font-mono text-base text-cyan-600 dark:text-cyan-400 font-black">
                    ₹{myBestQuote.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              )}

              {/* Quick Decrement Buttons */}
              {isBiddingActive && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Quick Underbid Helpers
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDecrement(1000)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      -₹1,000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDecrement(2500)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      -₹2,500
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDecrement(5000)}
                      className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      -₹5,000
                    </button>
                  </div>
                </div>
              )}

              {bidError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs"
                >
                  {bidError}
                </motion.div>
              )}

              {bidSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                >
                  {bidSuccess}
                </motion.div>
              )}

              {!isBiddingActive ? (
                <div className="p-6 rounded-2xl bg-slate-100/50 dark:bg-dark-850/50 border border-slate-200 dark:border-white/5 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1">
                  <ShieldAlert className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    Bidding Interface Disabled
                  </p>
                  <p>
                    {rfq.status === 'UPCOMING'
                      ? 'Auction has not opened yet.'
                      : 'Auction has concluded. No further quotations accepted.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Carrier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      placeholder="e.g. BlueDart Prime Cargo"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Freight (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={freightCharges}
                        onChange={(e) => setFreightCharges(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="25000"
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Origin (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={originCharges}
                        onChange={(e) => setOriginCharges(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="3000"
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Dest (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={destinationCharges}
                        onChange={(e) => setDestinationCharges(e.target.value ? parseFloat(e.target.value) : '')}
                        placeholder="2000"
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Auto-Calculated Total */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 dark:bg-dark-950 border border-cyan-500/30 text-white flex items-center justify-between shadow-glow-cyan">
                    <span className="text-xs font-bold text-slate-400">
                      Total Quotation =
                    </span>
                    <span className="font-mono font-black text-lg text-cyan-400">
                      ₹{totalQuotation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Transit SLA
                      </label>
                      <input
                        type="text"
                        value={transitTime}
                        onChange={(e) => setTransitTime(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Quote Validity
                      </label>
                      <input
                        type="text"
                        value={quoteValidity}
                        onChange={(e) => setQuoteValidity(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-dark-850 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bidSubmitting}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs shadow-glow-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {bidSubmitting ? 'Transmitting Bid to Engine...' : 'Place Official Quotation'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-2xl glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 p-5 text-xs space-y-2.5">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Buyer Monitoring Console
              </h3>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                You are logged in as a <strong>Buyer</strong>. You have full oversight of competitive carrier bids, leaderboard ranking shifts, and auction extensions.
              </p>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                Tip: Use the top <strong>Quick Demo Bar</strong> to switch to any supplier to submit lower quotes and trigger extensions!
              </p>
            </div>
          )}

          {/* Extension Rules Card */}
          <div className="rounded-2xl glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200/60 dark:border-white/10 pb-2">
              Extension Engine Parameters
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">British Auction:</span>
                <strong className="text-emerald-500 dark:text-emerald-400 font-bold">
                  {rfq.auction_config?.british_auction_enabled ? 'Active / Enabled' : 'Disabled'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Trigger Window (X):</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">
                  Last {rfq.auction_config?.trigger_window_minutes} Minutes
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Extension Duration (Y):</span>
                <strong className="font-mono text-cyan-500 dark:text-cyan-400">
                  +{rfq.auction_config?.extension_duration_minutes} Minutes
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Trigger Type:</span>
                <strong className="text-violet-500 dark:text-violet-400 text-right max-w-[140px] truncate">
                  {rfq.auction_config?.extension_trigger_type.replace(/_/g, ' ')}
                </strong>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">Forced Close Ceiling:</span>
                <strong className="font-mono text-rose-500 dark:text-rose-400 text-right">
                  {new Date(rfq.forced_close_time).toLocaleTimeString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Animated Chronological Activity Timeline */}
          <div className="rounded-2xl glass-panel dark:bg-dark-900/80 border border-slate-200/80 dark:border-white/10 p-5 shadow-glass space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Live Activity Timeline
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {activityLogs.length} Events
              </span>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                    log.event_type === 'AUCTION_EXTENDED'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-glow-amber'
                      : log.event_type === 'AUCTION_FORCE_CLOSED'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                      : log.event_type === 'RANKING_CHANGED'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-900 dark:text-cyan-200'
                      : 'bg-slate-100/50 dark:bg-dark-850/50 border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[11px] flex items-center gap-1.5">
                      {log.event_type === 'AUCTION_EXTENDED' && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      )}
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {log.event_description}
                  </p>
                  {log.previous_close_time &&
                    log.updated_close_time &&
                    log.previous_close_time !== log.updated_close_time && (
                      <div className="text-[10px] font-mono text-cyan-500 dark:text-cyan-400 pt-0.5">
                        Shift: {new Date(log.previous_close_time).toLocaleTimeString()} &rarr;{' '}
                        {new Date(log.updated_close_time).toLocaleTimeString()}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
