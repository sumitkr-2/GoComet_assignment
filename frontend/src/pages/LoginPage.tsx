import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Shield, Lock, Mail, ArrowRight, Gavel, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authAPI.login(email, password);
      login(res);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <Gavel className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          British Auction RFQ System
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enterprise Reverse Bidding & Automated Extension Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('buyer@cocomet.com', 'Buyer@123')}
                className="p-2.5 text-left border border-indigo-200 rounded-lg bg-indigo-50/60 hover:bg-indigo-100 transition-colors"
              >
                <span className="font-bold text-indigo-900 block">Buyer (Apex)</span>
                <span className="text-[10px] text-indigo-700">buyer@cocomet.com</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('supplier1@cocomet.com', 'Supplier@123')}
                className="p-2.5 text-left border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-bold text-slate-800 block">Supplier 1</span>
                <span className="text-[10px] text-slate-500">BlueDart Freight</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('supplier2@cocomet.com', 'Supplier@123')}
                className="p-2.5 text-left border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-bold text-slate-800 block">Supplier 2</span>
                <span className="text-[10px] text-slate-500">DHL Forwarding</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('supplier3@cocomet.com', 'Supplier@123')}
                className="p-2.5 text-left border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="font-bold text-slate-800 block">Supplier 3</span>
                <span className="text-[10px] text-slate-500">Maersk Logistics</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Register supplier/buyer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
