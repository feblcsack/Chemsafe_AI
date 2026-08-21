"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: ToastType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, message, duration };
    
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: {
      bg: "bg-safe/10 border-safe/30",
      text: "text-safe",
      icon: "text-safe",
    },
    error: {
      bg: "bg-corrosive/10 border-corrosive/30",
      text: "text-corrosive",
      icon: "text-corrosive",
    },
    warning: {
      bg: "bg-hazard/10 border-hazard/30",
      text: "text-hazard",
      icon: "text-hazard",
    },
    info: {
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-400",
      icon: "text-blue-400",
    },
  };

  const Icon = icons[toast.type];
  const color = colors[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg ${color.bg}`}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${color.icon}`} />
      <p className={`flex-1 text-sm ${color.text}`}>{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X size={18} className="text-steel" />
      </button>
    </motion.div>
  );
}
