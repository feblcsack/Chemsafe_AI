"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient?: string;
  delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, gradient = "from-hazard/20 to-transparent", delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-hazard/10 via-transparent to-safe/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative h-full p-6 rounded-2xl border border-white/10 bg-ink/40 backdrop-blur-sm hover:border-hazard/30 transition-all duration-300">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4`}>
          <Icon className="text-hazard" size={24} />
        </div>
        
        <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
        <p className="text-steel text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatCard({ value, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center p-6 rounded-xl border border-white/10 bg-ink/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: delay + 0.2, type: "spring" }}
        className="font-display font-bold text-4xl mb-2 bg-gradient-to-r from-hazard via-yellow-300 to-hazard bg-clip-text text-transparent"
      >
        {value}
      </motion.div>
      <p className="text-steel text-sm">{label}</p>
    </motion.div>
  );
}
