"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Spotlight } from "@/components/ui/spotlight";
import { ScanGrid } from "@/components/ui/scan-grid";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { FloatingIcons } from "@/components/ui/floating-icons";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ScanLine, 
  ShieldCheck, 
  Eye, 
  Trophy,
  Target,
  QrCode,
  Camera,
  Shield,
  AlertTriangle,
  Check,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Zap
} from "lucide-react";

const pillars = [
  {
    icon: ScanLine,
    title: "GHS Lens",
    description: "Real-time hazard symbol detection directly from your browser camera.",
    action: "Start Scanning",
    href: "/scan"
  },
  {
    icon: Trophy,
    title: "Hazmon Progress",
    description: "Each scan adds to your Hazmon collection, strengthening safety literacy.",
    action: "View Hazdex",
    href: "/worker/hazdex"
  },
  {
    icon: ShieldCheck,
    title: "PPE Guardian",
    description: "Monitor work zones and PPE compliance for field teams in real-time.",
    action: "Go to Dashboard",
    href: "/login"
  },
];

const gameplayLoop = [
  {
    icon: Camera,
    title: "Capture",
    detail: "Point your camera at a GHS label"
  },
  {
    icon: Eye,
    title: "Recognize",
    detail: "GHS Lens reads the symbol and risk level"
  },
  {
    icon: Trophy,
    title: "Unlock",
    detail: "New Hazmon appears in your Hazdex"
  },
  {
    icon: Shield,
    title: "Protect",
    detail: "System provides PPE guidance and zone briefing"
  }
];

const hazmons = [
  { name: "Ignivore", type: "Flammable", icon: Flame, tone: "from-rose-500/20 to-orange-500/10", accent: "text-rose-300" },
  { name: "Oxidrax", type: "Oxidizing", icon: Zap, tone: "from-amber-500/20 to-yellow-500/10", accent: "text-amber-300" },
  { name: "Detonyx", type: "Explosive", icon: AlertTriangle, tone: "from-orange-500/20 to-red-500/10", accent: "text-orange-300" },
  { name: "Corrolith", type: "Corrosive", icon: Shield, tone: "from-emerald-500/20 to-teal-500/10", accent: "text-emerald-300" },
  { name: "Venomask", type: "Toxic", icon: AlertTriangle, tone: "from-violet-500/20 to-fuchsia-500/10", accent: "text-violet-300" },
];

const faqs = [
  {
    q: "What is Hazmon on this platform?",
    a: "Hazmon is a gamification layer for GHS detection results. Each hazard category has a unique character to help workers remember risks and safety actions more effectively."
  },
  {
    q: "What is GHS Lens used for?",
    a: "GHS Lens scans chemical hazard labels using your camera. After a symbol is detected, the system displays risk context, PPE recommendations, and your Hazdex progress."
  },
  {
    q: "Is it suitable for operational teams?",
    a: "Yes. Workers can check into zones, receive safety briefings, get monitored for PPE compliance, and receive alerts when potential violations are detected."
  },
  {
    q: "Is camera data sent outside the device?",
    a: "For browser scanner mode, inference is designed to run client-side, making the process more private and faster for daily use."
  }
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden font-sans">
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <ScanGrid />
        <Spotlight />
        <AnimatedGradient />
        <FloatingIcons />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="default" className="mb-6 px-4 py-2 font-medium">
              <Sparkles size={14} className="mr-1" /> 
              New Feature: Hazmon Safety Mode
            </Badge>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-paper">Hazmon makes safety</span>
            <br />
            <span className="bg-gradient-to-r from-hazard via-yellow-300 to-hazard bg-clip-text text-transparent">
              feel like a mission, not a manual
            </span>
          </motion.h1>

          <motion.p 
            className="text-steel text-lg max-w-2xl leading-relaxed mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Hazmon unifies GHS Lens, Hazdex collection, and PPE guidance in one workflow.
            The goal is simple: detect fast, learn better, work safe.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/scan">
              <Button size="lg" className="text-base px-8 group font-medium">
                <QrCode size={18} />
                Try GHS Lens
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 group border-white/20 hover:border-hazard/40 font-medium">
                <ShieldCheck size={18} />
                Team Dashboard
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <Link href={pillar.href}>
                    <Card className="group h-full border-white/10 bg-ink/60 hover:border-hazard/40 transition-all duration-300">
                      <CardHeader className="space-y-3">
                        <div className="w-10 h-10 rounded-lg bg-hazard/10 flex items-center justify-center">
                          <Icon className="text-hazard" size={20} />
                        </div>
                        <CardTitle className="text-lg font-semibold">{pillar.title}</CardTitle>
                        <CardDescription className="text-sm">{pillar.description}</CardDescription>
                        <p className="text-sm text-paper flex items-center gap-2 font-medium">
                          {pillar.action}
                          <ArrowUpRight size={14} className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </p>
                      </CardHeader>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-white/10">
        <AnimatedGradient />
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-white/5 border border-white/10 font-medium">
              <Sparkles size={14} className="mr-1" />
              Gameplay Loop
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              One Flow to Scan, Learn, and Comply
            </h2>
            <p className="text-steel text-lg max-w-2xl mx-auto">
              No gimmicks, no fake testimonials. Just a workflow that's relevant for daily safety.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {gameplayLoop.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <Card className="h-full bg-ink/50 border-white/10 hover:border-white/20 transition-colors">
                    <CardContent className="pt-6">
                      <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Icon size={20} className="text-paper" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-steel">{item.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-white/10">
        <AnimatedGradient />
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-gradient-to-r from-hazard/20 to-purple-500/20 font-medium">
              <Trophy size={14} className="mr-1" />
              Hazmon Collection
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Clean Cards, Clear Focus, Easy to Read
            </h2>
            <p className="text-steel text-lg max-w-2xl mx-auto">
              Each card represents a real risk category. Click to see hazard context,
              PPE recommendations, and handling steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {hazmons.map((hazmon, index) => (
              <motion.div
                key={hazmon.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group"
              >
                <Card className="h-full border-white/10 bg-gradient-to-br from-ink/70 to-ink/40 hover:border-hazard/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="muted" className="border border-white/20 text-xs font-medium">
                        {hazmon.type}
                      </Badge>
                      <Target size={14} className="text-steel" />
                    </div>

                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${hazmon.tone} border border-white/10 flex items-center justify-center mb-4`}>
                      <hazmon.icon size={24} className={hazmon.accent} />
                    </div>

                    <h4 className="font-semibold text-paper text-base mb-1">
                      {hazmon.name}
                    </h4>
                    <p className="text-steel text-sm">Scan to unlock safety insights.</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full border-hazard/30 bg-hazard/5">
                <CardContent className="pt-6">
                  <div className="bg-hazard/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <ScanLine className="text-hazard" size={24} />
                  </div>
                  <h3 className="font-semibold text-paper mb-2">1. Scan Label</h3>
                  <p className="text-steel text-sm">
                    GHS Lens reads the label instantly.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full border-purple-500/30 bg-purple-500/5">
                <CardContent className="pt-6">
                  <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <Trophy className="text-purple-400" size={24} />
                  </div>
                  <h3 className="font-semibold text-paper mb-2">2. Discover Hazmon</h3>
                  <p className="text-steel text-sm">
                    Detected hazard automatically enters your Hazdex.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="h-full border-safe/30 bg-safe/5">
                <CardContent className="pt-6">
                  <div className="bg-safe/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="text-safe" size={24} />
                  </div>
                  <h3 className="font-semibold text-paper mb-2">3. Learn Safety</h3>
                  <p className="text-steel text-sm">
                    Access PPE recommendations and follow-up guides.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-6 border-t border-white/10">
        <AnimatedGradient />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <Badge className="mb-4 bg-white/5 border border-white/10 font-medium">
              <Check size={14} className="mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-steel">Concise answers for field needs.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((item, index) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group rounded-xl border border-white/10 bg-ink/50 px-5 py-4"
              >
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                  <span className="font-medium text-paper">{item.q}</span>
                  <ArrowRight size={16} className="text-steel group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-sm text-steel mt-3 leading-relaxed">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-32 px-6">
        <AnimatedGradient />
        <FloatingIcons />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-4xl mx-auto text-center"
        >
          <div className="relative p-12 rounded-3xl border border-hazard/30 bg-gradient-to-br from-hazard/10 via-ink/50 to-safe/10 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(242,183,7,0.15),transparent_70%)]" />
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Level Up with Hazmon?
              </h2>
              <p className="text-steel text-lg mb-8 max-w-2xl mx-auto">
                Start with one scan, build it into a consistent safety habit.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/scan">
                  <Button size="lg" className="text-base px-10 group font-medium">
                    <Target size={18} />
                    Get Started
                    <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  </Button>
                </Link>
                
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-base px-10 border-white/20 hover:border-hazard/40 font-medium">
                    <ShieldCheck size={18} />
                    Worker Area
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-steel flex-wrap">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-safe" />
                  Fast scanner
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-safe" />
                  Real safety focus
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-safe" />
                  Hazmon gamification
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
