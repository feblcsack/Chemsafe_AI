'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GHSScannerWithHazmon from '@/components/GHSScannerWithHazmon';
import { HazmonCard } from '@/types/hazmon';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScanGrid } from '@/components/ui/scan-grid';
import { AnimatedGradient } from '@/components/ui/animated-gradient';
import { hazmonService } from '@/lib/hazmonService';

export default function WorkerScanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hazdexStats, setHazdexStats] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        // Load Hazdex stats
        const stats = await hazmonService.getHazdexStats(user.id);
        setHazdexStats(stats);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function handleScanComplete(hazmon: HazmonCard) {
    // Refresh stats after scan
    if (userId) {
      const stats = await hazmonService.getHazdexStats(userId);
      setHazdexStats(stats);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-steel text-xl">Loading scanner...</div>
      </div>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <main className="relative min-h-screen px-6 py-10 overflow-hidden">
      <ScanGrid />
      <AnimatedGradient />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/worker/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-3">
            <Sparkles size={14} className="mr-1" />
            Worker GHS Scanner
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Chemical Hazard Detection
          </h1>
          <p className="text-steel text-sm max-w-xl mx-auto">
            Scan GHS labels to identify hazards, receive safety recommendations, and collect Hazmons 
            to track your chemical safety knowledge.
          </p>
        </motion.div>

        {/* Hazdex Stats Widget */}
        {hazdexStats && hazdexStats.totalCollected > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link href="/worker/hazdex">
              <Card className="border-hazard/30 bg-gradient-to-r from-hazard/10 to-safe/10 hover:border-hazard/50 transition-all cursor-pointer group">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🎴</div>
                      <div>
                        <p className="font-display font-bold text-paper mb-0.5">My Hazdex Collection</p>
                        <p className="text-steel text-xs">
                          {hazdexStats.totalCollected}/{hazdexStats.totalPossible} Hazmons • {hazdexStats.completionPercent}% Complete
                        </p>
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-hazard group-hover:scale-110 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Safety Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-5">
              <h3 className="font-display font-semibold text-paper mb-2 text-sm">
                💡 Scanning Tips:
              </h3>
              <ul className="text-steel text-xs space-y-1">
                <li>• Ensure good lighting on the label</li>
                <li>• Hold camera steady for 1-2 seconds</li>
                <li>• Position pictogram in center of frame</li>
                <li>• Scan multiple labels to complete your Hazdex</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* GHS Scanner with Hazmon Integration */}
        <GHSScannerWithHazmon
          userId={userId}
          onScanComplete={handleScanComplete}
        />
      </div>
    </main>
  );
}
