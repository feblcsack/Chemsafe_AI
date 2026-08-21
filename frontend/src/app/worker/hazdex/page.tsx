'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hazmonService } from '@/lib/hazmonService';
import HazdexGrid from '@/components/HazdexGrid';
import HazmonCardReveal from '@/components/HazmonCardReveal';
import { HazmonCard } from '@/types/hazmon';
import { motion } from 'framer-motion';
import { Trophy, Target, Flame, ArrowLeft, Sparkles, Award, ScanLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScanGrid } from '@/components/ui/scan-grid';
import { AnimatedGradient } from '@/components/ui/animated-gradient';

export default function WorkerHazdexPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [collectedHazmons, setCollectedHazmons] = useState<HazmonCard[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedHazmon, setSelectedHazmon] = useState<HazmonCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        // Load Hazdex collection
        const hazdex = await hazmonService.getUserHazdex(user.id);
        setCollectedHazmons(hazdex);

        // Load stats
        const hazdexStats = await hazmonService.getHazdexStats(user.id);
        setStats(hazdexStats);
      } catch (error) {
        console.error('Error loading Hazdex:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="text-steel text-xl font-medium">Loading Hazdex...</div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen px-6 py-10 overflow-hidden">
      <ScanGrid />
      <AnimatedGradient />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-paper transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-3">
            <Sparkles size={14} className="mr-1" />
            Your Safety Collection
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            🎴 Hazdex
          </h1>
          <p className="text-steel text-sm max-w-xl mx-auto">
            Track your chemical safety knowledge through collected Hazmons
          </p>
        </motion.div>

        {/* Achievement Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {/* Total Collection */}
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardContent className="pt-5 text-center">
                <div className="text-blue-400 text-3xl mb-2">📚</div>
                <div className="text-paper text-2xl font-bold">
                  {stats.totalCollected}/{stats.totalPossible}
                </div>
                <div className="text-steel text-xs mt-1">Collected</div>
                <div className="mt-2 w-full bg-ink rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${stats.completionPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mastered Count */}
            <Card className="border-hazard/30 bg-hazard/5">
              <CardContent className="pt-5 text-center">
                <div className="text-hazard text-3xl mb-2">⭐</div>
                <div className="text-paper text-2xl font-bold">
                  {stats.masteredCount}
                </div>
                <div className="text-steel text-xs mt-1">Mastered</div>
                {stats.masteredCount > 0 && (
                  <div className="text-hazard text-xs mt-2 font-medium">
                    +{stats.masteredCount * 10} Points
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Total Scans */}
            <Card className="border-safe/30 bg-safe/5">
              <CardContent className="pt-5 text-center">
                <div className="text-safe text-3xl mb-2">🔍</div>
                <div className="text-paper text-2xl font-bold">
                  {stats.totalScans}
                </div>
                <div className="text-steel text-xs mt-1">Total Scans</div>
                <div className="text-safe text-xs mt-2 font-medium">
                  {stats.totalScans > 50 ? 'Expert! 🏆' : 'Keep going!'}
                </div>
              </CardContent>
            </Card>

            {/* Completion */}
            <Card
              className={`
                border ${
                  stats.completionPercent === 100
                    ? 'border-purple-500/30 bg-purple-500/5'
                    : 'border-steel/20 bg-steel/5'
                }
              `}
            >
              <CardContent className="pt-5 text-center">
                <div className="text-3xl mb-2">
                  {stats.completionPercent === 100 ? '🏆' : '🎯'}
                </div>
                <div className="text-paper text-2xl font-bold">
                  {stats.completionPercent}%
                </div>
                <div className="text-steel text-xs mt-1">
                  {stats.completionPercent === 100 ? 'Complete!' : 'Progress'}
                </div>
                {stats.completionPercent === 100 && (
                  <div className="text-purple-400 text-xs mt-2 font-bold">
                    ⭐ Master ⭐
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Discoveries */}
        {stats?.recentDiscoveries && stats.recentDiscoveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="border-hazard/20 bg-gradient-to-r from-hazard/5 to-safe/5">
              <CardContent className="pt-5">
                <h3 className="text-paper font-bold mb-3 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-hazard" />
                  Recent Discoveries
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {stats.recentDiscoveries.map((hazmon: HazmonCard) => (
                    <button
                      key={hazmon.id}
                      onClick={() => setSelectedHazmon(hazmon)}
                      className="flex-shrink-0 w-28 bg-ink hover:bg-steel/10 rounded-lg p-3 transition-all hover:scale-105 border border-white/10"
                    >
                      <div className="text-4xl mb-2">{hazmon.iconEmoji}</div>
                      <div className="text-paper text-xs font-bold truncate">
                        {hazmon.name}
                      </div>
                      <div className="text-steel text-xs truncate">
                        {new Date(hazmon.discoveredAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Hazdex Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <HazdexGrid
            collectedHazmons={collectedHazmons}
            onCardClick={(hazmon) => setSelectedHazmon(hazmon)}
          />
        </motion.div>

        {/* Empty State */}
        {collectedHazmons.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-hazard/30 bg-gradient-to-br from-hazard/10 to-safe/10 text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🎴</div>
                <h3 className="text-paper text-2xl font-bold mb-2">
                  Your Hazdex is Empty
                </h3>
                <p className="text-steel mb-6 max-w-md mx-auto">
                  Scan your first GHS label to start building your Hazmon collection
                  and learn about chemical hazards around you.
                </p>
                <Button
                  onClick={() => router.push('/worker/dashboard')}
                  className="inline-flex items-center gap-2"
                  size="lg"
                >
                  <Target className="w-5 h-5" />
                  Start Scanning
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Hazmon Detail Modal */}
      {selectedHazmon && (
        <HazmonCardReveal
          hazmonCard={selectedHazmon}
          isNew={false}
          onClose={() => setSelectedHazmon(null)}
          onViewSafety={() => {
            router.push(`/safety/${selectedHazmon.ghsCategory}`);
          }}
          allowImageUpload={true}
        />
      )}
    </main>
  );
}
