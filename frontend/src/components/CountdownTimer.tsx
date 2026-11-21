import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { RFQStatus } from '../types';

interface CountdownTimerProps {
  closeTime: string;
  forcedCloseTime?: string;
  triggerWindowMinutes?: number;
  status: RFQStatus;
  onExpire?: () => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  closeTime,
  forcedCloseTime,
  triggerWindowMinutes = 10,
  status,
  onExpire,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isPast: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: false });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(closeTime).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isPast: true });
        if (onExpire && status === 'ACTIVE') {
          onExpire();
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, totalSeconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [closeTime, onExpire, status]);

  if (status === 'FORCE_CLOSED') {
    return (
      <div className={`flex items-center gap-1.5 font-medium text-rose-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
        <span>Forced Close Limit Reached</span>
      </div>
    );
  }

  if (status === 'CLOSED' || timeLeft.isPast) {
    return (
      <div className={`flex items-center gap-1.5 font-medium text-slate-500 ${compact ? 'text-xs' : 'text-sm'}`}>
        <Clock className="w-4 h-4 shrink-0" />
        <span>Auction Ended</span>
      </div>
    );
  }

  const triggerWindowSeconds = triggerWindowMinutes * 60;
  const isInsideTriggerWindow = timeLeft.totalSeconds <= triggerWindowSeconds;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (compact) {
    return (
      <div className={`flex items-center gap-1 font-mono font-semibold ${isInsideTriggerWindow ? 'text-amber-600 animate-pulse' : 'text-slate-700'} text-xs`}>
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
        {isInsideTriggerWindow && (
          <span className="ml-1 px-1 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
            WINDOW
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 border transition-all ${isInsideTriggerWindow ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-2 ring-amber-400/20' : 'bg-slate-900 border-slate-800 text-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isInsideTriggerWindow ? 'text-amber-800' : 'text-slate-400'}`}>
          <Clock className="w-3.5 h-3.5" />
          Auction Closing In
        </span>
        {isInsideTriggerWindow && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-bold animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            TRIGGER WINDOW ACTIVE ({triggerWindowMinutes}m)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 font-mono">
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[50px] ${isInsideTriggerWindow ? 'bg-amber-100/90 text-amber-950 border border-amber-200' : 'bg-slate-800 text-white'}`}>
          <span className="text-2xl font-bold">{pad(timeLeft.hours)}</span>
          <span className="text-[10px] uppercase text-slate-500 font-sans font-medium">Hours</span>
        </div>
        <span className={`text-xl font-bold ${isInsideTriggerWindow ? 'text-amber-700' : 'text-slate-500'}`}>:</span>
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[50px] ${isInsideTriggerWindow ? 'bg-amber-100/90 text-amber-950 border border-amber-200' : 'bg-slate-800 text-white'}`}>
          <span className="text-2xl font-bold">{pad(timeLeft.minutes)}</span>
          <span className="text-[10px] uppercase text-slate-500 font-sans font-medium">Mins</span>
        </div>
        <span className={`text-xl font-bold ${isInsideTriggerWindow ? 'text-amber-700' : 'text-slate-500'}`}>:</span>
        <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[50px] ${isInsideTriggerWindow ? 'bg-amber-200 text-amber-950 border border-amber-300 font-black' : 'bg-slate-800 text-white'}`}>
          <span className="text-2xl font-bold">{pad(timeLeft.seconds)}</span>
          <span className="text-[10px] uppercase text-slate-500 font-sans font-medium">Secs</span>
        </div>
      </div>

      {isInsideTriggerWindow && (
        <p className="mt-2 text-xs text-amber-800">
          ⚡ Any qualifying bidding activity during this window automatically extends the auction!
        </p>
      )}
    </div>
  );
};
