import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { rfqAPI, biddingAPI, rankingAPI, activityAPI } from '../services/api';
import { RFQ, Quotation, RFQRankings, ActivityLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { CountdownTimer } from '../components/CountdownTimer';
import { StatCard } from '../components/StatCard';
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
  DollarSign
} from 'lucide-react';

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

  // Auto-calculated total quotation
  const totalQuotation =
    (Number(freightCharges) || 0) +
    (Number(originCharges) || 0) +
    (Number(destinationCharges) || 0);

  // Find user's existing best quotation
  const myExistingQuotes = bids.filter((b) => b.supplier_id === user?.supplier_id);
  const myBestQuote = myExistingQuotes.length > 0
    ? Math.min(...myExistingQuotes.map((q) => q.total_amount))
    : null;

  const fetchAllData = async () => {
    if (!rfqId) return;
    try {
      const [rfqData, rankData, bidsData, actData] = await Promise.all([
        rfqAPI.getById(rfqId),
        rankingAPI.getRankings(rfqId),
        biddingAPI.getBids(rfqId),
        activityAPI.getLogs(rfqId),
      ]);
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

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError(null);
    setBidSuccess(null);

    if (totalQuotation <= 0) {
      setBidError('Total quotation must be greater than ₹0.00');
      return;
    }

    if (myBestQuote !== null && totalQuotation >= myBestQuote) {
      setBidError(`Reverse auction rule: Your new bid (₹${totalQuotation.toLocaleString()}) must be lower than your current best bid (₹${myBestQuote.toLocaleString()}).`);
      return;
    }

    setBidSubmitting(true);
    try {
      const res = await biddingAPI.submitBid(rfqId, {
        carrier_name: carrierName,
        freight_charges: Number(freightCharges),
        origin_charges: Number(originCharges),
        destination_charges: Number(destinationCharges),
        transit_time: transitTime,
        quote_validity: quoteValidity,
      });

      let msg = `Quotation submitted! You are currently ranked ${res.rank}.`;
      if (res.auction_extended) {
        msg += ` ⚡ British Auction Extended to ${new Date(res.new_close_time).toLocaleTimeString()}!`;
      }
      setBidSuccess(msg);
      // Reset monetary charges for next lower bid
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Entering live auction bidding room...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p>Auction not found.</p>
        <Link to="/auctions" className="text-indigo-600 font-bold text-xs mt-2 inline-block">
          &larr; Back to Auctions
        </Link>
      </div>
    );
  }

  const isBiddingActive = rfq.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Auctions
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs text-slate-500 font-mono">Live Bidding Sync Active</span>
        </div>
      </div>

      {/* Main Auction Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-indigo-700 border border-slate-200">
                {rfq.reference_id}
              </span>
              <StatusBadge status={rfq.status} isExtended={rfq.is_extended} />
              {rfq.auction_config?.british_auction_enabled && (
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  British Auction: {rfq.auction_config.extension_trigger_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {rfq.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Pickup Date: <strong className="text-slate-700">{new Date(rfq.pickup_service_date).toLocaleDateString()}</strong>
              </span>
              <span>•</span>
              <span>Buyer: <strong className="text-slate-700">{rfq.buyer_name || 'Procurement Team'}</strong></span>
              <span>•</span>
              <span>Total Quotations: <strong className="text-slate-700">{bids.length}</strong></span>
            </div>
          </div>

          {/* Countdown Timer Block */}
          <div className="min-w-[280px]">
            <CountdownTimer
              closeTime={rfq.current_close_time}
              forcedCloseTime={rfq.forced_close_time}
              status={rfq.status}
              triggerWindowMinutes={rfq.auction_config?.trigger_window_minutes}
              onExpire={fetchAllData}
            />
          </div>
        </div>

        {/* Extension Alert Banner */}
        {rfq.is_extended && (
          <div className="mt-5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-bold">
                British Auction Automatic Extension Triggered!
              </p>
              <p className="text-indigo-700 text-[11px] mt-0.5 leading-relaxed">
                Qualifying bidding activity occurred within the configured trigger window. 
                Closing time has been automatically extended from <span className="line-through">{new Date(rfq.original_close_time).toLocaleTimeString()}</span> to{' '}
                <strong>{new Date(rfq.current_close_time).toLocaleTimeString()}</strong>.
                Hard forced closing ceiling: <strong>{new Date(rfq.forced_close_time).toLocaleTimeString()}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4 Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Lowest Bid (L1)"
          value={
            rankings?.current_lowest_bid
              ? `₹${rankings.current_lowest_bid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              : 'No Bids Yet'
          }
          subtitle={rankings?.l1_company_name ? `Held by ${rankings.l1_company_name}` : 'Awaiting first quotation'}
          icon={TrendingDown}
          color="emerald"
        />
        <StatCard
          title="Participating Suppliers"
          value={rankings?.total_suppliers || 0}
          subtitle="Active competing carriers"
          icon={Truck}
          color="indigo"
        />
        <StatCard
          title="Current Close Time"
          value={new Date(rfq.current_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          subtitle={`Originally ${new Date(rfq.original_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Forced Close Limit"
          value={new Date(rfq.forced_close_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          subtitle="Hard ceiling deadline"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Main Grid: Leaderboard & Bid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Leaderboard / Rankings & Quotation History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Rankings Leaderboard */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-indigo-600" />
                  Live Supplier Leaderboard (Rankings)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lowest total quotation holds L1 position (Reverse Auction)
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {rankings?.rankings.length || 0} Active Quotes
              </span>
            </div>

            <div className="overflow-x-auto">
              {rankings?.rankings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No quotations submitted yet. Be the first supplier to bid!
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Supplier / Carrier</th>
                      <th className="py-3 px-4">Charges Breakdown</th>
                      <th className="py-3 px-4">Total Bid</th>
                      <th className="py-3 px-4">Terms</th>
                      <th className="py-3 px-4">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {rankings?.rankings.map((item) => (
                      <tr
                        key={item.supplier_id}
                        className={`transition-colors ${
                          item.rank === 'L1'
                            ? 'bg-emerald-50/50 hover:bg-emerald-50 font-medium'
                            : item.is_current_user
                            ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                              item.rank === 'L1'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : item.rank === 'L2'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.rank}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">
                              {item.company_name}
                            </span>
                            {item.is_current_user && (
                              <span className="px-1.5 py-0.2 bg-indigo-600 text-white font-bold rounded text-[9px]">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Truck className="w-3 h-3 text-slate-400" />
                            {item.carrier_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          <div>Freight: ₹{item.freight_charges.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">
                            Origin: ₹{item.origin_charges.toLocaleString()} • Dest: ₹{item.destination_charges.toLocaleString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`font-bold text-sm ${
                              item.rank === 'L1' ? 'text-emerald-700' : 'text-slate-800'
                            }`}
                          >
                            ₹{item.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          <div>Transit: {item.transit_time}</div>
                          <div className="text-[10px] text-slate-400">Valid: {item.quote_validity}</div>
                        </td>

                        <td className="py-3.5 px-4 text-[10px] text-slate-400 font-mono">
                          {new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Complete Chronological Quotation Audit History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Quotation Submission History ({bids.length} total bids)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every quotation and price reduction preserved for transparency
              </p>
            </div>

            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Supplier</th>
                    <th className="py-2.5 px-4">Carrier</th>
                    <th className="py-2.5 px-4">Total Quote</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {bids.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 font-mono">
                      <td className="py-2 px-4 font-sans font-medium text-slate-800">
                        {b.supplier_company_name}
                      </td>
                      <td className="py-2 px-4 font-sans text-slate-600">
                        {b.carrier_name}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-900">
                        ₹{b.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-4 font-sans">
                        {b.is_latest ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Current Bid {b.rank ? `(${b.rank})` : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Superseded
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-[10px] text-slate-500">
                        {new Date(b.submitted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Bid Submission Form & Activity Stream */}
        <div className="space-y-6">
          {/* Supplier Quotation Submission Form */}
          {isSupplier ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-indigo-600" />
                  Submit / Lower Quotation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reverse Bidding: Each new bid must beat your previous quotation
                </p>
              </div>

              {myBestQuote !== null && (
                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                  <span>Your Current Best Bid:</span>
                  <strong className="font-mono text-sm text-indigo-700">
                    ₹{myBestQuote.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              )}

              {bidError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {bidError}
                </div>
              )}

              {bidSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                  {bidSuccess}
                </div>
              )}

              {!isBiddingActive ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs space-y-1">
                  <ShieldAlert className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-700">Bidding Interface Disabled</p>
                  <p>
                    {rfq.status === 'UPCOMING'
                      ? 'Auction has not opened yet.'
                      : 'Auction has ended. No further quotations accepted.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBidSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Carrier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={carrierName}
                      onChange={(e) => setCarrierName(e.target.value)}
                      placeholder="e.g. BlueDart Cargo Express"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Auto Calculated Total */}
                  <div className="p-3 rounded-lg bg-slate-900 text-white flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Total Quotation =
                    </span>
                    <span className="font-mono font-black text-base text-emerald-400">
                      ₹{totalQuotation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Transit Time
                      </label>
                      <input
                        type="text"
                        value={transitTime}
                        onChange={(e) => setTransitTime(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Quote Validity
                      </label>
                      <input
                        type="text"
                        value={quoteValidity}
                        onChange={(e) => setQuoteValidity(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={bidSubmitting}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {bidSubmitting ? 'Transmitting Bid...' : 'Place Official Quotation'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-indigo-50/70 rounded-xl border border-indigo-200 p-5 text-indigo-900 text-xs space-y-2">
              <h3 className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                Buyer Monitoring Mode
              </h3>
              <p className="leading-relaxed text-indigo-800">
                You are logged in as a <strong>Buyer</strong>. You have complete visibility over supplier bids, 
                rankings, extension events, and audit logs.
              </p>
              <p className="text-[11px] text-indigo-700">
                To test submitting bids and triggering extensions, use the <strong>Quick Demo Bar</strong> at the top to switch to any of the 3 supplier accounts.
              </p>
            </div>
          )}

          {/* Extension Rules Inspector Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Auction Extension Parameters
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">British Auction:</span>
                <strong className="text-emerald-700">
                  {rfq.auction_config?.british_auction_enabled ? 'Active / Enabled' : 'Disabled'}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trigger Window (X):</span>
                <strong className="font-mono text-slate-800">
                  Last {rfq.auction_config?.trigger_window_minutes} Minutes
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Extension Duration (Y):</span>
                <strong className="font-mono text-slate-800">
                  +{rfq.auction_config?.extension_duration_minutes} Minutes
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trigger Type:</span>
                <strong className="text-indigo-700 text-right max-w-[140px] truncate">
                  {rfq.auction_config?.extension_trigger_type.replace(/_/g, ' ')}
                </strong>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">Forced Close Limit:</span>
                <strong className="font-mono text-rose-700 text-right">
                  {new Date(rfq.forced_close_time).toLocaleTimeString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Chronological Auction Activity Logs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Live Auction Activity Stream
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {activityLogs.length} Events
              </span>
            </div>

            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {activityLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                    log.event_type === 'AUCTION_EXTENDED'
                      ? 'bg-amber-50 border-amber-200 text-amber-950 shadow-sm'
                      : log.event_type === 'AUCTION_FORCE_CLOSED'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : log.event_type === 'RANKING_CHANGED'
                      ? 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
                      : 'bg-slate-50 border-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[11px] flex items-center gap-1">
                      {log.event_type === 'AUCTION_EXTENDED' && <Sparkles className="w-3 h-3 text-amber-600 animate-spin" />}
                      {log.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">
                    {log.event_description}
                  </p>
                  {log.previous_close_time && log.updated_close_time && log.previous_close_time !== log.updated_close_time && (
                    <div className="text-[10px] font-mono text-indigo-700 pt-0.5">
                      Deadline shifted: {new Date(log.previous_close_time).toLocaleTimeString()} &rarr; {new Date(log.updated_close_time).toLocaleTimeString()}
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
