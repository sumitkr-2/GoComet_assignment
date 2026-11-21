import React from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Shield, Truck, Zap } from 'lucide-react';

export const QuickDemoBar: React.FC = () => {
  const { user, login } = useAuth();

  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      const res = await authAPI.login(email, pass);
      login(res);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 text-xs py-1.5 px-4 flex items-center justify-between gap-3 shadow-inner overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 font-bold text-amber-400">
          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="hidden sm:inline">QUICK SWITCH:</span>
        </span>
        <span className="text-slate-400 text-[11px] hidden lg:inline">
          Test real-time competition across accounts
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => handleQuickLogin('buyer@cocomet.com', 'Buyer@123')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
            user?.email === 'buyer@cocomet.com'
              ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Buyer (Rajesh Sharma)"
        >
          <Shield className="w-3 h-3 text-indigo-400" />
          Buyer (Apex)
        </button>

        <button
          onClick={() => handleQuickLogin('supplier1@cocomet.com', 'Supplier@123')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
            user?.email === 'supplier1@cocomet.com'
              ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Supplier 1 (BlueDart)"
        >
          <Truck className="w-3 h-3 text-blue-400" />
          Supplier 1 (BlueDart)
        </button>

        <button
          onClick={() => handleQuickLogin('supplier2@cocomet.com', 'Supplier@123')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
            user?.email === 'supplier2@cocomet.com'
              ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Supplier 2 (DHL)"
        >
          <Truck className="w-3 h-3 text-emerald-400" />
          Supplier 2 (DHL)
        </button>

        <button
          onClick={() => handleQuickLogin('supplier3@cocomet.com', 'Supplier@123')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
            user?.email === 'supplier3@cocomet.com'
              ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-400'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Login as Supplier 3 (Maersk)"
        >
          <Truck className="w-3 h-3 text-purple-400" />
          Supplier 3 (Maersk)
        </button>
      </div>
    </div>
  );
};
