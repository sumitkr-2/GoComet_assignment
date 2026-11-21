import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Lock, Mail, ArrowRight, Gavel, Sparkles, Shield, Truck } from 'lucide-react';
import { TiltCard3D } from '../components/TiltCard3D';
import { AuroraBackground } from '../components/AuroraBackground';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-dark-950 text-white overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-glow-cyan border border-white/20">
            <Gavel className="w-8 h-8" />
          </div>
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          British Auction RFQ System
        </h2>
        <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Enterprise Reverse Bidding Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <TiltCard3D glowColor="cyan" intensity={6}>
          <div className="glass-panel dark:bg-dark-900/85 p-8 rounded-3xl border border-white/10 shadow-glass space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold"
              >
                {error}
              </motion.div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-dark-850/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-dark-850/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-glow-cyan text-xs font-black text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                Instant 1-Click Demo Login
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoFill('buyer@cocomet.com', 'Buyer@123')}
                  className="p-2.5 text-left border border-indigo-500/30 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-all group"
                >
                  <span className="font-bold text-indigo-300 group-hover:text-indigo-200 block text-xs flex items-center gap-1">
                    <Shield className="w-3 h-3 text-indigo-400" /> Buyer (Apex)
                  </span>
                  <span className="text-[10px] text-slate-400">buyer@cocomet.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('supplier1@cocomet.com', 'Supplier@123')}
                  className="p-2.5 text-left border border-cyan-500/30 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 transition-all group"
                >
                  <span className="font-bold text-cyan-300 group-hover:text-cyan-200 block text-xs flex items-center gap-1">
                    <Truck className="w-3 h-3 text-cyan-400" /> Supplier 1
                  </span>
                  <span className="text-[10px] text-slate-400">BlueDart Freight</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('supplier2@cocomet.com', 'Supplier@123')}
                  className="p-2.5 text-left border border-emerald-500/30 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-all group"
                >
                  <span className="font-bold text-emerald-300 group-hover:text-emerald-200 block text-xs flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-400" /> Supplier 2
                  </span>
                  <span className="text-[10px] text-slate-400">DHL Forwarding</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('supplier3@cocomet.com', 'Supplier@123')}
                  className="p-2.5 text-left border border-violet-500/30 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 transition-all group"
                >
                  <span className="font-bold text-violet-300 group-hover:text-violet-200 block text-xs flex items-center gap-1">
                    <Truck className="w-3 h-3 text-violet-400" /> Supplier 3
                  </span>
                  <span className="text-[10px] text-slate-400">Maersk Logistics</span>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                Need a new account?{' '}
                <Link to="/register" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </TiltCard3D>
      </div>
    </div>
  );
};
