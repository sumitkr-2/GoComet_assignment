import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';
import { Quotation } from '../types';
import { TrendingDown, Activity } from 'lucide-react';

interface BidHistoryChartProps {
  bids: Quotation[];
}

export const BidHistoryChart: React.FC<BidHistoryChartProps> = ({ bids }) => {
  if (!bids || bids.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-cyan-500" />
        <p>No bid progression data available yet.</p>
        <p className="text-[11px] mt-0.5">Submit quotations to generate the real-time price trend curve.</p>
      </div>
    );
  }

  // Sort bids chronologically
  const sorted = [...bids].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  const chartData = sorted.map((b, idx) => ({
    index: idx + 1,
    supplier: b.supplier_company_name || `Supplier #${b.supplier_id}`,
    carrier: b.carrier_name,
    amount: b.total_amount,
    time: new Date(b.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const minAmount = Math.min(...chartData.map((d) => d.amount));
  const maxAmount = Math.max(...chartData.map((d) => d.amount));
  const yDomainMin = Math.max(0, Math.floor(minAmount * 0.9 / 1000) * 1000);
  const yDomainMax = Math.ceil(maxAmount * 1.05 / 1000) * 1000;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-glow-cyan" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Reverse Bidding Price Curve (Descending)
          </span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 font-bold">
          Current Lowest: ₹{minAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bidPriceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="glass-panel p-3 rounded-xl border border-white/20 shadow-glass text-xs font-sans text-white">
                      <p className="font-bold text-cyan-300">{data.supplier}</p>
                      <p className="text-[11px] text-slate-300">Carrier: {data.carrier}</p>
                      <p className="text-sm font-mono font-black text-emerald-400 mt-1">
                        ₹{data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{data.time}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#06b6d4"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#bidPriceGrad)"
              style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
