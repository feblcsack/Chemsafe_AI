// Hazmon Service - Business logic for Hazmon collection system

import { createClient } from '@/lib/supabase/client';
import { 
  HazmonCard, 
  HazdexEntry, 
  HAZMON_DATABASE, 
  GHSCategory,
  HAZARDOUS_COMBINATIONS,
  CombinationAlert
} from '@/types/hazmon';

export class HazmonService {
  private supabase = createClient();

  /**
   * Process a GHS scan and create/update Hazmon entry
   */
  async processGHSScan(params: {
    userId: string;
    ghsCategory: GHSCategory;
    productName: string;
    ghsFact: string;
    safetyRecommendation: string;
    safetyScore: number;
    location?: {
      lat: number;
      lng: number;
      label?: string;
    };
  }): Promise<{ 
    hazmonCard: HazmonCard; 
    isNewDiscovery: boolean;
    combinationAlert?: CombinationAlert;
  }> {
    const hazmonData = HAZMON_DATABASE[params.ghsCategory];
    
    if (!hazmonData) {
      throw new Error(`Unknown GHS category: ${params.ghsCategory}`);
    }

    // Check for existing entry
    const { data: existingEntry, error: fetchError } = await this.supabase
      .from('hazdex_entries')
      .select('*')
      .eq('user_id', params.userId)
      .eq('hazmon_id', hazmonData.id)
      .single();

    let isNewDiscovery = false;
    let hazdexEntryId: string;

    if (!existingEntry) {
      // Create new entry
      isNewDiscovery = true;
      const { data: newEntry, error: insertError } = await this.supabase
        .from('hazdex_entries')
        .insert({
          user_id: params.userId,
          hazmon_id: hazmonData.id,
          times_encountered: 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      hazdexEntryId = newEntry.id;
    } else {
      // Update existing entry
      const { data: updatedEntry, error: updateError } = await this.supabase
        .from('hazdex_entries')
        .update({
          times_encountered: existingEntry.times_encountered + 1,
          last_encountered_at: new Date().toISOString(),
        })
        .eq('id', existingEntry.id)
        .select()
        .single();

      if (updateError) throw updateError;
      hazdexEntryId = existingEntry.id;
    }

    // Create scan record
    const { error: scanRecordError } = await this.supabase
      .from('hazmon_scan_records')
      .insert({
        hazdex_entry_id: hazdexEntryId,
        product_name: params.productName,
        ghs_category: params.ghsCategory,
        ghs_fact: params.ghsFact,
        safety_recommendation: params.safetyRecommendation,
        safety_score: params.safetyScore,
        location_lat: params.location?.lat,
        location_lng: params.location?.lng,
        location_label: params.location?.label,
      });

    if (scanRecordError) throw scanRecordError;

    // Check for dangerous combinations
    const combinationAlert = await this.checkCombinations(params.userId, hazmonData.id);

    // Fetch updated entry with all scan records
    const { data: fullEntry } = await this.supabase
      .from('hazdex_entries')
      .select('*, hazmon_scan_records(*)')
      .eq('id', hazdexEntryId)
      .single();

    const hazmonCard: HazmonCard = {
      ...hazmonData,
      discoveredFrom: params.productName,
      ghsFact: params.ghsFact,
      safetyRecommendation: params.safetyRecommendation,
      discoveredAt: fullEntry.first_discovered_at,
      location: params.location,
      isMastered: fullEntry.is_mastered,
      timesEncountered: fullEntry.times_encountered,
      powerLevel: params.safetyScore,
    };

    return { hazmonCard, isNewDiscovery, combinationAlert };
  }

  /**
   * Check for hazardous chemical combinations
   */
  private async checkCombinations(
    userId: string,
    newHazmonId: string
  ): Promise<CombinationAlert | undefined> {
    // Get recent scans (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentEntries } = await this.supabase
      .from('hazdex_entries')
      .select('hazmon_id, last_encountered_at')
      .eq('user_id', userId)
      .gte('last_encountered_at', oneHourAgo)
      .neq('hazmon_id', newHazmonId);

    if (!recentEntries || recentEntries.length === 0) {
      return undefined;
    }

    // Check against known hazardous combinations
    for (const entry of recentEntries) {
      const combination = HAZARDOUS_COMBINATIONS.find(
        (combo) =>
          (combo.hazmon1.id === entry.hazmon_id && combo.hazmon2.id === newHazmonId) ||
          (combo.hazmon2.id === entry.hazmon_id && combo.hazmon1.id === newHazmonId)
      );

      if (combination) {
        // Log the alert
        await this.supabase.from('hazmon_fusion_alerts').insert({
          user_id: userId,
          hazmon_id_1: entry.hazmon_id,
          hazmon_id_2: newHazmonId,
          severity: combination.severity,
        });

        return combination;
      }
    }

    return undefined;
  }

  /**
   * Get user's complete Hazdex collection
   */
  async getUserHazdex(userId: string): Promise<HazmonCard[]> {
    const { data: entries, error } = await this.supabase
      .from('hazdex_entries')
      .select(`
        *,
        hazmon_scan_records(*)
      `)
      .eq('user_id', userId)
      .order('first_discovered_at', { ascending: false });

    if (error) throw error;

    return entries.map((entry) => {
      const hazmonData = Object.values(HAZMON_DATABASE).find(
        (h) => h.id === entry.hazmon_id
      );

      if (!hazmonData) {
        throw new Error(`Unknown hazmon_id in database: ${entry.hazmon_id}`);
      }

      const latestScan = entry.hazmon_scan_records[entry.hazmon_scan_records.length - 1];

      return {
        ...hazmonData,
        discoveredFrom: latestScan?.product_name || 'Unknown',
        ghsFact: latestScan?.ghs_fact || '',
        safetyRecommendation: latestScan?.safety_recommendation || '',
        discoveredAt: entry.first_discovered_at,
        location: latestScan?.location_lat
          ? {
              lat: latestScan.location_lat,
              lng: latestScan.location_lng,
              label: latestScan.location_label,
            }
          : undefined,
        isMastered: entry.is_mastered,
        timesEncountered: entry.times_encountered,
        powerLevel: latestScan?.safety_score || hazmonData.powerLevel,
      };
    });
  }

  /**
   * Mark a Hazmon as mastered (user completed safety quiz)
   */
  async masterHazmon(userId: string, hazmonId: string): Promise<void> {
    const { error } = await this.supabase
      .from('hazdex_entries')
      .update({
        is_mastered: true,
        mastered_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('hazmon_id', hazmonId);

    if (error) throw error;
  }

  /**
   * Get Hazdex statistics
   */
  async getHazdexStats(userId: string): Promise<{
    totalCollected: number;
    totalPossible: number;
    masteredCount: number;
    totalScans: number;
    completionPercent: number;
    recentDiscoveries: HazmonCard[];
  }> {
    const allHazmons = await this.getUserHazdex(userId);
    const totalPossible = Object.keys(HAZMON_DATABASE).length;

    return {
      totalCollected: allHazmons.length,
      totalPossible,
      masteredCount: allHazmons.filter((h) => h.isMastered).length,
      totalScans: allHazmons.reduce((sum, h) => sum + h.timesEncountered, 0),
      completionPercent: Math.round((allHazmons.length / totalPossible) * 100),
      recentDiscoveries: allHazmons.slice(0, 5),
    };
  }

  /**
   * Get habitat map data (hazards by location)
   */
  async getHabitatMap(userId: string): Promise<{
    lat: number;
    lng: number;
    hazmons: Array<{ id: string; name: string; count: number }>;
  }[]> {
    const { data: scanRecords, error } = await this.supabase
      .from('hazmon_scan_records')
      .select(`
        *,
        hazdex_entries!inner(user_id, hazmon_id)
      `)
      .eq('hazdex_entries.user_id', userId)
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null);

    if (error) throw error;

    // Group by location (rounded to 4 decimal places ~11m accuracy)
    const locationMap = new Map<string, any>();

    scanRecords.forEach((record) => {
      const lat = Math.round(record.location_lat * 10000) / 10000;
      const lng = Math.round(record.location_lng * 10000) / 10000;
      const key = `${lat},${lng}`;

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          lat,
          lng,
          hazmons: new Map<string, { id: string; name: string; count: number }>(),
        });
      }

      const location = locationMap.get(key);
      const hazmonData = Object.values(HAZMON_DATABASE).find(
        (h) => h.id === record.hazdex_entries.hazmon_id
      );

      if (hazmonData) {
        const existing = location.hazmons.get(hazmonData.id);
        if (existing) {
          existing.count++;
        } else {
          location.hazmons.set(hazmonData.id, {
            id: hazmonData.id,
            name: hazmonData.name,
            count: 1,
          });
        }
      }
    });

    return Array.from(locationMap.values()).map((loc) => ({
      lat: loc.lat,
      lng: loc.lng,
      hazmons: Array.from(loc.hazmons.values()),
    }));
  }
}

// Export singleton instance
export const hazmonService = new HazmonService();
