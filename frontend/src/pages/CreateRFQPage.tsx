import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfqAPI } from '../services/api';
import { ExtensionTriggerType } from '../types';
import {
  Gavel,
  Calendar,
  Clock,
  ShieldAlert,
  ArrowRight,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CreateRFQPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default initial values
  const now = new Date();
  const formatDatetimeLocal = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startTimeDefault = formatDatetimeLocal(now);
  const closeTimeDefault = formatDatetimeLocal(new Date(now.getTime() + 60 * 60 * 1000)); // +1h
  const forcedCloseDefault = formatDatetimeLocal(new Date(now.getTime() + 120 * 60 * 1000)); // +2h
  const pickupDefault = formatDatetimeLocal(new Date(now.getTime() + 72 * 60 * 1000 * 60)); // +3 days

  const [formData, setFormData] = useState({
    name: '',
    reference_id: `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
    bid_start_time: startTimeDefault,
    bid_close_time: closeTimeDefault,
    forced_close_time: forcedCloseDefault,
    pickup_service_date: pickupDefault,
    british_auction_enabled: true,
    trigger_window_minutes: 10,
    extension_duration_minutes: 5,
    extension_trigger_type: 'BID_RECEIVED' as ExtensionTriggerType,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'trigger_window_minutes' || name === 'extension_duration_minutes') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Quick preset helper for fast interview demonstration
  const handleFastDemoPreset = () => {
    const current = new Date();
    setFormData({
      name: 'Pharma Cold-Chain Express (Fast Demo Test)',
      reference_id: `RFQ-FAST-${Math.floor(100 + Math.random() * 900)}`,
      bid_start_time: formatDatetimeLocal(new Date(current.getTime() - 5 * 60 * 1000)), // Started 5m ago
      bid_close_time: formatDatetimeLocal(new Date(current.getTime() + 90 * 1000)), // Closes in 90s
      forced_close_time: formatDatetimeLocal(new Date(current.getTime() + 6 * 60 * 1000)), // Hard limit 6m
      pickup_service_date: formatDatetimeLocal(new Date(current.getTime() + 24 * 60 * 60 * 1000)),
      british_auction_enabled: true,
      trigger_window_minutes: 2,
      extension_duration_minutes: 1,
      extension_trigger_type: 'BID_RECEIVED',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const start = new Date(formData.bid_start_time).getTime();
    const close = new Date(formData.bid_close_time).getTime();
    const forced = new Date(formData.forced_close_time).getTime();

    if (start >= close) {
      setError('Validation Error: Bid Start Time must be strictly earlier than Bid Close Time.');
      return;
    }
    if (close >= forced) {
      setError('Validation Error: Forced Bid Close Time must be strictly later than Bid Close Time.');
      return;
    }
    if (formData.trigger_window_minutes <= 0) {
      setError('Validation Error: Trigger Window must be a positive number of minutes.');
      return;
    }
    if (formData.extension_duration_minutes <= 0) {
      setError('Validation Error: Extension Duration must be a positive number of minutes.');
      return;
    }

    setLoading(true);
    try {
      const created = await rfqAPI.create({
        ...formData,
        bid_start_time: new Date(formData.bid_start_time).toISOString(),
        bid_close_time: new Date(formData.bid_close_time).toISOString(),
        forced_close_time: new Date(formData.forced_close_time).toISOString(),
        pickup_service_date: new Date(formData.pickup_service_date).toISOString(),
      });
      navigate(`/rfqs/${created.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create RFQ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-600" />
            Create Request For Quotation (RFQ)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure British Auction parameters, trigger windows, extension rules, and forced close caps
          </p>
        </div>

        <button
          type="button"
          onClick={handleFastDemoPreset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Load Fast-Demo Preset (90s window)
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic RFQ Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. General RFQ Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                RFQ Title / Service Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Heavy Steel Coils - Jamshedpur to Mumbai"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reference ID *
              </label>
              <input
                type="text"
                name="reference_id"
                required
                value={formData.reference_id}
                onChange={handleChange}
                placeholder="e.g. RFQ-2026-009"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Required Pickup / Service Date *
            </label>
            <input
              type="datetime-local"
              name="pickup_service_date"
              required
              value={formData.pickup_service_date}
              onChange={handleChange}
              className="w-full sm:w-1/2 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Auction Time Boundaries */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              2. Auction Bidding Timeline
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Start &lt; Close &lt; Forced Close
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Bid Start Date & Time *
              </label>
              <input
                type="datetime-local"
                name="bid_start_time"
                required
                value={formData.bid_start_time}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Original Bid Close Time *
              </label>
              <input
                type="datetime-local"
                name="bid_close_time"
                required
                value={formData.bid_close_time}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1 text-rose-700">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Forced Bid Close Time *
              </label>
              <input
                type="datetime-local"
                name="forced_close_time"
                required
                value={formData.forced_close_time}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono bg-rose-50/30"
              />
              <span className="text-[10px] text-rose-600 block mt-1">
                Hard ceiling: Auction will NEVER extend past this point.
              </span>
            </div>
          </div>
        </div>

        {/* British Auction Automatic Extension Engine Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              3. British Auction Extension Rules
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="british_auction_enabled"
                checked={formData.british_auction_enabled}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {formData.british_auction_enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </label>
          </div>

          {formData.british_auction_enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trigger Window (X Minutes) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    name="trigger_window_minutes"
                    required
                    value={formData.trigger_window_minutes}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Monitors qualifying bidding activity inside the last {formData.trigger_window_minutes} minutes before close.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Extension Duration (Y Minutes) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    name="extension_duration_minutes"
                    required
                    value={formData.extension_duration_minutes}
                    onChange={handleChange}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Extends the closing time by +{formData.extension_duration_minutes} minutes when trigger occurs.
                  </p>
                </div>
              </div>

              {/* Extension Trigger Types */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Extension Trigger Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Type A */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.extension_trigger_type === 'BID_RECEIVED'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="extension_trigger_type"
                        value="BID_RECEIVED"
                        checked={formData.extension_trigger_type === 'BID_RECEIVED'}
                        onChange={handleChange}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        Type A: Bid Received
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      Extends whenever <strong>any valid quotation</strong> is placed within the last X minutes.
                    </p>
                  </label>

                  {/* Type B */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.extension_trigger_type === 'ANY_RANK_CHANGE'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="extension_trigger_type"
                        value="ANY_RANK_CHANGE"
                        checked={formData.extension_trigger_type === 'ANY_RANK_CHANGE'}
                        onChange={handleChange}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        Type B: Any Rank Change
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      Extends only when <strong>any supplier ranking position changes</strong> in the last X minutes.
                    </p>
                  </label>

                  {/* Type C */}
                  <label
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      formData.extension_trigger_type === 'L1_RANK_CHANGE'
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="extension_trigger_type"
                        value="L1_RANK_CHANGE"
                        checked={formData.extension_trigger_type === 'L1_RANK_CHANGE'}
                        onChange={handleChange}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        Type C: Lowest Bidder (L1) Change
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      Extends only when a <strong>new lowest supplier (L1)</strong> emerges. Self-lowering by L1 does not extend.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/auctions')}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Publishing RFQ...' : 'Publish British Auction RFQ'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
