// Hazmon Service for Household (No Authentication Required)
// Uses localStorage for persistence

import { 
  HazmonCard, 
  HAZMON_DATABASE, 
  GHSCategory,
  HAZARDOUS_COMBINATIONS,
  CombinationAlert
} from '@/types/hazmon';

const STORAGE_KEY = 'chemsafe_hazdex';
const SESSION_SCANS_KEY = 'chemsafe_session_scans';

interface LocalHazmonEntry {
  hazmonId: string;
  firstDiscoveredAt: string;
  lastEncounteredAt: string;
  timesEncountered: number;
  isMastered: boolean;
  scans: Array<{
    productName: string;
    timestamp: string;
    safetyScore: number;
  }>;
}

export class HouseholdHazmonService {
  /**
   * Get user's Hazdex from localStorage
   */
  private getLocalHazdex(): Record<string, LocalHazmonEntry> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save Hazdex to localStorage
   */
  private saveLocalHazdex(hazdex: Record<string, LocalHazmonEntry>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hazdex));
    } catch (error) {
      console.error('Failed to save Hazdex:', error);
    }
  }

  /**
   * Get session scans (last hour) for combination detection
   */
  private getSessionScans(): Array<{ hazmonId: string; timestamp: number }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(SESSION_SCANS_KEY);
      const scans = stored ? JSON.parse(stored) : [];
      
      // Filter scans from last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      return scans.filter((scan: any) => scan.timestamp > oneHourAgo);
    } catch {
      return [];
    }
  }

  /**
   * Add scan to session
   */
  private addSessionScan(hazmonId: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const scans = this.getSessionScans();
      scans.push({ hazmonId, timestamp: Date.now() });
      
      // Keep only last 10 scans
      const recent = scans.slice(-10);
      localStorage.setItem(SESSION_SCANS_KEY, JSON.stringify(recent));
    } catch (error) {
      console.error('Failed to save session scan:', error);
    }
  }

  /**
   * Process a GHS scan and create/update Hazmon entry
   */
  async processGHSScan(params: {
    ghsCategory: GHSCategory;
    productName: string;
    ghsFact: string;
    safetyRecommendation: string;
    safetyScore: number;
  }): Promise<{ 
    hazmonCard: HazmonCard; 
    isNewDiscovery: boolean;
    combinationAlert?: CombinationAlert;
  }> {
    const hazmonData = HAZMON_DATABASE[params.ghsCategory];
    
    if (!hazmonData) {
      throw new Error(`Unknown GHS category: ${params.ghsCategory}`);
    }

    const hazdex = this.getLocalHazdex();
    const existing = hazdex[hazmonData.id];
    const isNewDiscovery = !existing;
    const now = new Date().toISOString();

    if (!existing) {
      // New discovery
      hazdex[hazmonData.id] = {
        hazmonId: hazmonData.id,
        firstDiscoveredAt: now,
        lastEncounteredAt: now,
        timesEncountered: 1,
        isMastered: false,
        scans: [{
          productName: params.productName,
          timestamp: now,
          safetyScore: params.safetyScore,
        }],
      };
    } else {
      // Update existing
      existing.timesEncountered++;
      existing.lastEncounteredAt = now;
      existing.scans.push({
        productName: params.productName,
        timestamp: now,
        safetyScore: params.safetyScore,
      });
      
      // Keep only last 10 scans per Hazmon
      if (existing.scans.length > 10) {
        existing.scans = existing.scans.slice(-10);
      }
    }

    this.saveLocalHazdex(hazdex);
    this.addSessionScan(hazmonData.id);

    // Check for dangerous combinations
    const combinationAlert = this.checkCombinations(hazmonData.id);

    const hazmonCard: HazmonCard = {
      ...hazmonData,
      discoveredFrom: params.productName,
      ghsFact: params.ghsFact,
      safetyRecommendation: params.safetyRecommendation,
      discoveredAt: hazdex[hazmonData.id].firstDiscoveredAt,
      isMastered: hazdex[hazmonData.id].isMastered,
      timesEncountered: hazdex[hazmonData.id].timesEncountered,
      powerLevel: params.safetyScore,
    };

    return { hazmonCard, isNewDiscovery, combinationAlert };
  }

  /**
   * Check for hazardous chemical combinations
   */
  private checkCombinations(newHazmonId: string): CombinationAlert | undefined {
    const sessionScans = this.getSessionScans();
    
    // Check against known hazardous combinations
    for (const scan of sessionScans) {
      if (scan.hazmonId === newHazmonId) continue;
      
      const combination = HAZARDOUS_COMBINATIONS.find(
        (combo) =>
          (combo.hazmon1.id === scan.hazmonId && combo.hazmon2.id === newHazmonId) ||
          (combo.hazmon2.id === scan.hazmonId && combo.hazmon1.id === newHazmonId)
      );

      if (combination) {
        return combination;
      }
    }

    return undefined;
  }

  /**
   * Get user's complete Hazdex collection
   */
  getUserHazdex(): HazmonCard[] {
    const hazdex = this.getLocalHazdex();
    const entries = Object.values(hazdex);

    return entries.map((entry) => {
      const hazmonData = Object.values(HAZMON_DATABASE).find(
        (h) => h.id === entry.hazmonId
      );

      if (!hazmonData) {
        throw new Error(`Unknown hazmon_id: ${entry.hazmonId}`);
      }

      const latestScan = entry.scans[entry.scans.length - 1];

      return {
        ...hazmonData,
        discoveredFrom: latestScan?.productName || 'Unknown',
        ghsFact: '', // Not stored in localStorage
        safetyRecommendation: '', // Not stored in localStorage
        discoveredAt: entry.firstDiscoveredAt,
        isMastered: entry.isMastered,
        timesEncountered: entry.timesEncountered,
        powerLevel: latestScan?.safetyScore || hazmonData.powerLevel,
      };
    });
  }

  /**
   * Mark a Hazmon as mastered (user completed safety quiz)
   */
  masterHazmon(hazmonId: string): void {
    const hazdex = this.getLocalHazdex();
    if (hazdex[hazmonId]) {
      hazdex[hazmonId].isMastered = true;
      this.saveLocalHazdex(hazdex);
    }
  }

  /**
   * Get Hazdex statistics
   */
  getHazdexStats(): {
    totalCollected: number;
    totalPossible: number;
    masteredCount: number;
    totalScans: number;
    completionPercent: number;
    recentDiscoveries: HazmonCard[];
  } {
    const allHazmons = this.getUserHazdex();
    const totalPossible = Object.keys(HAZMON_DATABASE).length;

    // Sort by discovery date
    const sorted = [...allHazmons].sort((a, b) => 
      new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    );

    return {
      totalCollected: allHazmons.length,
      totalPossible,
      masteredCount: allHazmons.filter((h) => h.isMastered).length,
      totalScans: allHazmons.reduce((sum, h) => sum + h.timesEncountered, 0),
      completionPercent: Math.round((allHazmons.length / totalPossible) * 100),
      recentDiscoveries: sorted.slice(0, 5),
    };
  }

  /**
   * Clear all Hazdex data (for testing/reset)
   */
  clearHazdex(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SESSION_SCANS_KEY);
    } catch (error) {
      console.error('Failed to clear Hazdex:', error);
    }
  }
}

// Export singleton instance
export const householdHazmonService = new HouseholdHazmonService();
