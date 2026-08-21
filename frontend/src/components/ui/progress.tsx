"use client";

import { motion } from "framer-motion";

interface ProgressProps {
  value: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "hazard" | "safe" | "blue" | "purple";
  showLabel?: boolean;
}

export function Progress({ value, size = "md", color = "hazard", showLabel = false }: ProgressProps) {
  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colors = {
    hazard: "bg-hazard",
    safe: "bg-safe",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      <div className={`w-full ${heights[size]} bg-white/10 rounded-full overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`${heights[size]} ${colors[color]} rounded-full`}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-steel mt-1 text-right">{Math.round(clampedValue)}%</p>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
}

export function CircularProgress({ 
  value, 
  size = 120, 
  strokeWidth = 8, 
  color = "currentColor",
  showLabel = true 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-white/10"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="text-2xl font-display font-bold" style={{ color }}>
            {Math.round(clampedValue)}
          </span>
        </motion.div>
      )}
    </div>
  );
}
