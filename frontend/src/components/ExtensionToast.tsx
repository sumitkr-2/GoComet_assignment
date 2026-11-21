import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Clock, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExtensionToastProps {
  show: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'extension' | 'l1_change';
}

export const fireConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'],
  });
};

export const ExtensionToast: React.FC<ExtensionToastProps> = ({
  show,
  onClose,
  title,
  message,
  type = 'extension',
}) => {
  useEffect(() => {
    if (show) {
      if (type === 'l1_change') {
        fireConfetti();
      }
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed top-6 right-6 z-50 max-w-md w-full p-4 rounded-2xl glass-panel dark:bg-dark-900/90 border border-white/20 shadow-glow-cyan text-white overflow-hidden backdrop-blur-xl"
        >
          {/* Animated top glowing line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 animate-shimmer" />

          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                type === 'l1_change'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {type === 'l1_change' ? (
                <Award className="w-5 h-5 animate-bounce" />
              ) : (
                <Sparkles className="w-5 h-5 animate-spin" />
              )}
            </div>

            <div className="flex-1 pr-2">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                {title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
