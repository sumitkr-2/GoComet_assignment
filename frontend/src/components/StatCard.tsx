import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TiltCard3D } from './TiltCard3D';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  color = 'cyan',
}) => {
  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/20',
      bgGlow: 'bg-cyan-500/10 text-cyan-400',
      shadow: 'hover:shadow-glow-cyan',
      iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-500 dark:text-cyan-400',
    },
    violet: {
      border: 'border-violet-500/20',
      bgGlow: 'bg-violet-500/10 text-violet-400',
      shadow: 'hover:shadow-glow-violet',
      iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-500 dark:text-violet-400',
    },
    emerald: {
      border: 'border-emerald-500/20',
      bgGlow: 'bg-emerald-500/10 text-emerald-400',
      shadow: 'hover:shadow-glow-emerald',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 dark:text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20',
      bgGlow: 'bg-amber-500/10 text-amber-400',
      shadow: 'hover:shadow-glow-amber',
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-400',
    },
    rose: {
      border: 'border-rose-500/20',
      bgGlow: 'bg-rose-500/10 text-rose-400',
      shadow: 'hover:shadow-glow-rose',
      iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-500 dark:text-rose-400',
    },
    indigo: {
      border: 'border-indigo-500/20',
      bgGlow: 'bg-indigo-500/10 text-indigo-400',
      shadow: 'hover:shadow-glow-cyan',
      iconBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-500 dark:text-indigo-400',
    },
  };

  const style = colorStyles[color];

  return (
    <TiltCard3D glowColor={color} intensity={8}>
      <div className="glass-panel dark:bg-dark-900/70 p-5 rounded-2xl border border-slate-200 dark:border-white/10 transition-colors duration-300 relative group overflow-hidden">
        {/* Subtle corner light sheen */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {title}
            </p>
            <motion.p
              key={String(value)}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-1 text-2xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              {value}
            </motion.p>
          </div>
          <div className={`p-3 rounded-xl border ${style.iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {(subtitle || trend) && (
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                {subtitle}
              </span>
            )}
            {trend && (
              <span
                className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                  trendType === 'positive'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : trendType === 'negative'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
        )}
      </div>
    </TiltCard3D>
  );
};
