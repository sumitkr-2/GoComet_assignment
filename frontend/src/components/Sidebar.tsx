import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Gavel,
  PlusCircle,
  History,
  TrendingDown,
  Shield,
  Truck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { user, isBuyer } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Procurement Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/auctions',
      label: 'All RFQ Auctions',
      icon: Gavel,
      badge: 'Live',
    },
    ...(isBuyer
      ? [
          {
            to: '/rfqs/new',
            label: 'Create New RFQ',
            icon: PlusCircle,
            badge: null,
          },
        ]
      : []),
    {
      to: '/activity',
      label: 'Live Activity Stream',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 glass-panel dark:bg-dark-900/80 border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between shrink-0 transition-colors duration-300 z-20">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/80 dark:border-white/10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-glow-cyan"
          >
            BA
          </motion.div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight leading-none">
              British Auction
            </h1>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              SaaS RFQ Platform
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3.5 my-3.5 rounded-xl bg-slate-100/70 dark:bg-dark-850/80 border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs uppercase shadow-sm">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                    isBuyer
                      ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user?.role}
                </span>
                {user?.company_name && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                    {user.company_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation Menu
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Reverse Bidding Dynamic</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Lower quotes win L1. Last-minute qualifying bids trigger automatic deadline extensions.
        </p>
      </div>
    </aside>
  );
};
