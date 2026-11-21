import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Sun, Moon, Bell, Shield, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { user, logout, isBuyer } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="h-16 border-b border-slate-200/80 dark:border-white/10 px-6 flex items-center justify-between glass-panel dark:bg-dark-900/60 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <span>Procurement Auction Center</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
              Live Engine
            </span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-dark-850/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium font-mono">Syncing (2s)</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Dark and Light theme"
          className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shadow-sm"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: isDark ? 0 : 180, scale: [0.9, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </motion.div>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">
              {user?.name}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              {isBuyer ? (
                <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> Buyer
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-0.5">
                  <Truck className="w-2.5 h-2.5" /> Supplier
                </span>
              )}
              {user?.company_name && (
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  • {user.company_name}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-sm"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
