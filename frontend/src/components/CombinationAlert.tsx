'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CombinationAlert as CombinationAlertType } from '@/types/hazmon';
import { AlertTriangle, Shield, X } from 'lucide-react';

interface CombinationAlertProps {
  combination: CombinationAlertType;
  onClose: () => void;
  onViewProcedure: () => void;
}

export default function CombinationAlert({
  combination,
  onClose,
  onViewProcedure,
}: CombinationAlertProps) {
  const severityConfig = {
    warning: {
      bg: 'from-yellow-900/90 to-yellow-800/90',
      border: 'border-yellow-500',
      icon: '⚠️',
      text: 'text-yellow-400',
      label: 'Caution',
    },
    danger: {
      bg: 'from-orange-900/90 to-red-800/90',
      border: 'border-orange-500',
      icon: '🚨',
      text: 'text-orange-400',
      label: 'Dangerous',
    },
    critical: {
      bg: 'from-corrosive/40 to-red-900/90',
      border: 'border-corrosive',
      icon: '🔥',
      text: 'text-corrosive',
      label: 'Extremely Dangerous',
    },
  };

  const config = severityConfig[combination.severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pulsing Warning Effect */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 bg-gradient-to-br ${config.bg} rounded-2xl blur-xl`}
          />

          {/* Main Card */}
          <div
            className={`
              relative bg-gradient-to-br ${config.bg} backdrop-blur-xl
              rounded-2xl overflow-hidden
              border-4 ${config.border}
              shadow-2xl
            `}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Header */}
            <div className="relative p-6 text-center border-b border-white/10">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="text-5xl mb-3"
              >
                {config.icon}
              </motion.div>
              <h3 className="font-display text-white text-2xl font-bold mb-1">
                ⚠ Risky Combination Detected
              </h3>
              <p className={`${config.text} text-sm font-semibold uppercase tracking-wider`}>
                {config.label}
              </p>
            </div>

            {/* Hazmon Combination Display */}
            <div className="p-6 space-y-4">
              {/* Two Hazmons */}
              <div className="flex items-center justify-center gap-4">
                {/* Hazmon 1 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${combination.hazmon1.primaryColor}40, ${combination.hazmon1.secondaryColor}60)`,
                    }}
                  >
                    {combination.hazmon1.iconEmoji}
                  </div>
                  <p className="text-white text-xs font-bold mt-2">
                    {combination.hazmon1.name}
                  </p>
                </div>

                {/* Plus Sign */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-white text-3xl font-bold"
                >
                  +
                </motion.div>

                {/* Hazmon 2 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${combination.hazmon2.primaryColor}40, ${combination.hazmon2.secondaryColor}60)`,
                    }}
                  >
                    {combination.hazmon2.iconEmoji}
                  </div>
                  <p className="text-white text-xs font-bold mt-2">
                    {combination.hazmon2.name}
                  </p>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">Hazard:</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {combination.warningMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Safe Procedure Preview */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 font-semibold text-sm mb-1">
                      Safe Procedure:
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {combination.safeProcedure}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 space-y-2">
              <button
                onClick={onViewProcedure}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-5 h-5" />
                View Full Procedure
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
