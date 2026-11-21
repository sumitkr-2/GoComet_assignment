import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Gavel,
  PlusCircle,
  History,
  TrendingDown,
  Building2,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isBuyer, isSupplier } = useAuth();

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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            BA
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight leading-none">
              British Auction RFQ
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Automated Extension Engine
            </p>
          </div>
        </div>

        {/* User Role Card */}
        <div className="p-4 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs uppercase">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isBuyer
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {user?.role}
                </span>
                {user?.company_name && (
                  <span className="text-[11px] text-slate-400 truncate max-w-[100px]">
                    {user.company_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Reverse Bidding Engine</span>
        </div>
        <p className="leading-relaxed">
          Suppliers underbid competitors. Bids within the trigger window automatically extend closing time.
        </p>
      </div>
    </aside>
  );
};
