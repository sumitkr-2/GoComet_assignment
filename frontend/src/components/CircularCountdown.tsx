import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { RFQStatus } from '../types';

interface CircularCountdownProps {
  startTime?: string;
  closeTime: string;
  forcedCloseTime?: string;
  triggerWindowMinutes?: number;
  status: RFQStatus;
  isExtended?: boolean;
  onExpire?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularCountdown: React.FC<CircularCountdownProps> = ({
  startTime,
  closeTime,
  forcedCloseTime,
  triggerWindowMinutes = 10,
  status,
  isExtended = false,
  onExpire,
  size = 'md',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isPast: boolean;
    percentage: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isPast: false,
    percentage: 100,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(closeTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      const start = startTime ? new Date(startTime).getTime() : target - 3600 * 1000;
      const totalDuration = target - start;

      if (diff <= 0) {
        setTimeLeft({
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isPast: true,
          percentage: 0,
        });
        if (onExpire && status === 'ACTIVE') {
          onExpire();
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      // Percentage remaining
      const pct = Math.max(0, Math.min(100, (diff / (totalDuration > 0 ? totalDuration : 3600000)) * 100));

      setTimeLeft({
        hours,
        minutes,
        seconds,
        totalSeconds,
        isPast: false,
        percentage: pct,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [closeTime, startTime, onExpire, status]);

  const pad = (num: number) => String(num).padStart(2, '0');

  const triggerWindowSeconds = triggerWindowMinutes * 60;
  const isInsideTriggerWindow = timeLeft.totalSeconds <= triggerWindowSeconds && !timeLeft.isPast;

  // SVG circular properties
  const radius = size === 'lg' ? 76 : size === 'md' ? 62 : 44;
  const strokeWidth = size === 'lg' ? 8 : size === 'md' ? 6 : 4.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft.percentage / 100) * circumference;

  // Color scheme
  let ringColor = 'url(#cyanVioletGrad)';
  let glowShadow = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))';

  if (status === 'FORCE_CLOSED') {
    ringColor = '#f43f5e';
    glowShadow = 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.6))';
  } else if (isInsideTriggerWindow) {
    ringColor = 'url(#amberRoseGrad)';
    glowShadow = 'drop-shadow(0 0 14px rgba(245, 158, 11, 0.7))';
  } else if (isExtended) {
    ringColor = 'url(#emeraldCyanGrad)';
    glowShadow = 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))';
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-slate-200 dark:text-slate-800"
              fill="transparent"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke={isInsideTriggerWindow ? '#f59e0b' : '#06b6d4'}
              strokeWidth="2.5"
              strokeDasharray={2 * Math.PI * 13}
              strokeDashoffset={2 * Math.PI * 13 - (timeLeft.percentage / 100) * (2 * Math.PI * 13)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <Clock className={`w-3.5 h-3.5 absolute ${isInsideTriggerWindow ? 'text-amber-500 animate-pulse' : 'text-cyan-500'}`} />
        </div>
        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl p-5 border glass-panel dark:bg-dark-900/80 dark:border-white/10 shadow-glass overflow-hidden transition-all duration-300">
      {/* Background radial highlight */}
      <div
        className="absolute -right-8 -top-8 w-44 h-44 rounded-full pointer-events-none opacity-20 blur-2xl"
        style={{
          background: isInsideTriggerWindow
            ? 'radial-gradient(circle, #f59e0b, transparent)'
            : 'radial-gradient(circle, #06b6d4, transparent)',
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          Auction Closing In
        </span>

        <AnimatePresence>
          {isInsideTriggerWindow && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-extrabold tracking-wide animate-pulse"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              TRIGGER WINDOW ({triggerWindowMinutes}m)
            </motion.span>
          )}

          {isExtended && !isInsideTriggerWindow && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              EXTENDED
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* Circular SVG Gauge */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            className="-rotate-90"
            width={radius * 2 + strokeWidth * 2}
            height={radius * 2 + strokeWidth * 2}
          >
            <defs>
              <linearGradient id="cyanVioletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="amberRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="emeraldCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Background track circle */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated progress circle */}
            <motion.circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: glowShadow }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>

          {/* Center text / Icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {status === 'FORCE_CLOSED' ? (
              <div className="text-rose-400 flex flex-col items-center">
                <ShieldAlert className="w-7 h-7 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Forced Close</span>
              </div>
            ) : status === 'CLOSED' || timeLeft.isPast ? (
              <div className="text-slate-400 flex flex-col items-center">
                <CheckCircle2 className="w-7 h-7 mb-1 text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Completed</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-2xl font-black font-mono tracking-tight text-white dark:text-white drop-shadow-sm">
                  {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">
                  {timeLeft.hours > 0 ? `${pad(timeLeft.hours)}h left` : 'Remaining'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Digit Blocks */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/60 dark:bg-dark-850/80 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-xl font-black text-cyan-400">{pad(timeLeft.hours)}</span>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-sans mt-0.5">Hours</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 dark:bg-dark-850/80 border border-white/5 text-center flex flex-col justify-center">
            <span className="text-xl font-black text-violet-400">{pad(timeLeft.minutes)}</span>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-sans mt-0.5">Minutes</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 dark:bg-dark-850/80 border border-white/5 text-center flex flex-col justify-center">
            <span className={`text-xl font-black ${isInsideTriggerWindow ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {pad(timeLeft.seconds)}
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-sans mt-0.5">Seconds</span>
          </div>
        </div>
      </div>

      {isInsideTriggerWindow && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3.5 text-center text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg py-1.5 px-3"
        >
          ⚡ Dynamic Extension Active: Qualifying bids in this window add time!
        </motion.p>
      )}
    </div>
  );
};
