"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface TestimonialProps {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  delay?: number;
}

export function TestimonialCard({ name, role, company, content, rating, delay = 0 }: TestimonialProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="p-6 rounded-2xl border border-white/10 bg-ink/40 backdrop-blur-sm hover:border-hazard/30 transition-all duration-300"
    >
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={16} className="fill-hazard text-hazard" />
        ))}
      </div>
      
      <p className="text-paper/90 text-sm leading-relaxed mb-4 italic">
        "{content}"
      </p>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hazard/30 to-safe/30 flex items-center justify-center font-display font-bold text-sm">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-display font-semibold text-sm">{name}</p>
          <p className="text-steel text-xs">{role} • {company}</p>
        </div>
      </div>
    </motion.div>
  );
}
