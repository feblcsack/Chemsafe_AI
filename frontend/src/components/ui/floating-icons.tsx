"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Eye, Lock, Cpu, Wifi } from "lucide-react";

const icons = [
  { Icon: Shield, x: "10%", y: "20%", delay: 0 },
  { Icon: Zap, x: "85%", y: "15%", delay: 0.5 },
  { Icon: Eye, x: "15%", y: "70%", delay: 1 },
  { Icon: Lock, x: "80%", y: "75%", delay: 1.5 },
  { Icon: Cpu, x: "50%", y: "10%", delay: 2 },
  { Icon: Wifi, x: "90%", y: "50%", delay: 2.5 },
];

export function FloatingIcons() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {icons.map(({ Icon, x, y, delay }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.2, 1],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 5 + index,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: x,
            top: y,
          }}
          className="text-hazard"
        >
          <Icon size={32} />
        </motion.div>
      ))}
    </div>
  );
}
